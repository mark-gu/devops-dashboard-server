import _ from 'lodash';
import * as Model from '../model';
import { RequestHelper } from '../utils/HttpHelpers';

const _baseUrl: string = process.env.BAMBOO_URI || '';
const _apiUrl: string = `${_baseUrl}/rest/api/latest`;
const _auth = `Basic ${process.env.BAMBOO_AUTH_TOKEN}`;
const _headers = {
    'Content-Type': 'application/json',
    'Authorization': _auth
};

class BambooProvider implements Model.IPipelineExecutionInfoProvider {
    public getPipelineExecutionsAsync(pipelineId: string, top: number = 10): Promise<Model.PipelineExecution[]> {
        const completedPromise = this._getCompletedAsync(pipelineId, top);
        const currentPromise = this._getCurrentAsync(pipelineId);

        return Promise.all([completedPromise, currentPromise]).then(values => {
            const arr1 = values[0] || [];
            const arr2 = values[1] || [];
            const merged = arr1.concat(arr2).sort((a, b) => b.sequenceNumber - a.sequenceNumber);

            return merged;
        });
    }

    public getPipelineExecutionAsync(pipelineId: string, executionId: string): Promise<Model.PipelineExecution | null> {
        return RequestHelper.get(`${_apiUrl}/result/${executionId}?expand=changes`, _headers).then((data: any) => {
            if (!data) {
                return null;
            }

            const item = data.result;
            const result: Model.PipelineExecution = {
                pipelineId: pipelineId,
                id: item.buildResultKey,
                sequenceNumber: parseInt(item.buildNumber),
                status: this._normalizeStatus(item.buildState),
                reason: this._normalizeReason(item.buildReason),
                changes: this._getCodeChanges(item.changes),
                timeStarted: item.buildStartedTime,
                duration: parseInt(item.buildDuration),
                uri: `${_baseUrl}/browse/${item.buildResultKey}`
            };

            if (item.progress) {
                result.progress = {
                    prettyStartedTime: item.progress.prettyStartedTime
                };
            }

            return result;
        });
    }

    public getPipelineTestRunAsync(pipelineId: string, executionId: string, testStepId: string): Promise<Model.PipelineTestRun | null> {
        const testRunId = executionId.replace(pipelineId, `${pipelineId}-${testStepId}`);

        return RequestHelper.get(`${_apiUrl}/result/${testRunId}?expand=artifacts`, _headers).then((data: any) => {
            if (!data) {
                return Promise.resolve(null);
            }

            const testRun = data.result
            const testRunResult = testRun.testResults ? testRun.testResults.$ : {};
            const testArtifacts = testRun.artifacts ? (_.isArray(testRun.artifacts.artifact) ? testRun.artifacts.artifact : [testRun.artifacts.artifact]) : [];

            const result: Model.PipelineTestRun = {
                pipelineId: pipelineId,
                pipelineExecutionId: executionId,
                testStepId: testStepId,
                id: testRun.buildResultKey,
                status: this._normalizeStatus(testRun.buildState),
                counters: {
                    all: parseInt(testRunResult.all),
                    succeeded: parseInt(testRunResult.successful),
                    failed: parseInt(testRunResult.failed),
                    skipped: parseInt(testRunResult.skipped),
                    quarantined: parseInt(testRunResult.quarantined)
                },
                duration: parseInt(testRun.buildDuration),
                timeStarted: testRun.buildStartedTime,
                uri: `${_baseUrl}/browse/${testRun.buildResultKey}`,
                artifacts: _.map(testArtifacts, i => {
                    return {
                        name: i.name,
                        uri: i.link.$.href
                    };
                })
            };

            const coverageArtifact = _.find(result.artifacts, i => i.name.toUpperCase().indexOf('COVERAGE') >= 0);
            if (coverageArtifact && coverageArtifact.uri) {
                return RequestHelper.get(coverageArtifact.uri, {
                    'Content-Type': 'text/html',
                    'Authorization': _auth
                }).then(($: any) => {
                    let text = $('.pc_cov').text();
                    if (text && text.length) {
                        let match = text.match(/([0-9]+)%/);

                        result.coverage = {
                            percentage: parseFloat(match[1]),
                            reportUri: coverageArtifact.uri
                        };
                    }

                    return result;
                });
            }

            return Promise.resolve(result);
        });
    }

    private _getCompletedAsync(pipelineId: string, top: number): Promise<Model.PipelineExecution[]> {
        return RequestHelper.get(`${_apiUrl}/result/${pipelineId}?max-results=${top}`, _headers).then((data: any) => {
            let result: Model.PipelineExecution[] = [];

            if (data) {
                data.results.results.result.forEach((item: any) => {
                    result.push({
                        pipelineId: pipelineId,
                        id: item.buildResultKey,
                        sequenceNumber: parseInt(item.buildNumber),
                        status: this._normalizeStatus(item.buildState),
                        uri: `${_baseUrl}/browse/${item.buildResultKey}`,
                        reason: '',
                        changes: [],
                        timeStarted: '',
                        duration: NaN
                    });
                });
            }

            return result;
        })
    }

    private _getCurrentAsync(pipelineId: string): Promise<Model.PipelineExecution[]> {
        return RequestHelper.get(`${_baseUrl}/build/admin/ajax/getDashboardSummary.action`, _headers).then((data: any) => {
            let result: Model.PipelineExecution[] = [];

            if (data) {
                data.builds.forEach((item: any) => {
                    if (pipelineId === item.planKey) {
                        result.push({
                            pipelineId: item.planKey,
                            id: item.planResultKey,
                            sequenceNumber: parseInt(item.buildNumber),
                            status: this._normalizeStatus(item.status),
                            reason: this._normalizeReason(item.triggerReason),
                            changes: [],
                            timeStarted: '',
                            duration: NaN,
                            uri: `${_baseUrl}/browse/${item.buildResultKey}`,
                            progress: {
                                prettyStartedTime: item.messageText
                            }
                        });
                    }
                });
            }

            return result;
        })
    }

    private _normalizeStatus(bambooStatus: string): string {
        switch ((bambooStatus || '').toUpperCase()) {
            case 'FAILED':
                return 'Failed';
            case 'SUCCESSFUL':
                return 'Succeeded';
            default:
                return 'Running';
        }
    }

    private _normalizeReason(bambooReason: string): string {
        return bambooReason.replace(/<a .+>(.+)<\/a>/, '$1').replace(/&lt;.+&gt;/, '').replace(/<.+@.+>/, '').trim();
    }

    private _getCodeChanges(bambooCodeChanges: any): Model.CodeChange[] {
        const result: Model.CodeChange[] = [];

        const length = parseInt(bambooCodeChanges.$.size);
        if (length === 1) {
            const i = bambooCodeChanges.change.$;
            result.push({
                id: i.changesetId,
                author: i.fullName || this._normalizeReason(i.author) || ''
            });
        }
        else if (length > 1) {
            _.each(bambooCodeChanges.changes || [], i => {
                result.push({
                    id: i.changesetId,
                    author: i.fullName || this._normalizeReason(i.author)
                });
            });
        }

        return result;
    }
}

module.exports = BambooProvider;
