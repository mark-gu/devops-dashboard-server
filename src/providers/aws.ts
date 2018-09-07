import _ from 'lodash';
import moment from 'moment';
import * as AWS from 'aws-sdk';
import * as Model from '../model';

const _region = process.env.AWS_REGION || 'ap-southeast-2';

class AwsProvider implements Model.IPipelineExecutionInfoProvider {
    constructor() {
        AWS.config.update({ region: _region });
        this._codePipeline = new AWS.CodePipeline();
        this._codeBuild = new AWS.CodeBuild();
    }

    private _codePipeline: AWS.CodePipeline;

    private _codeBuild: AWS.CodeBuild;

    public getPipelineExecutionsAsync(pipelineId: string, top: number = 10): Promise<Model.PipelineExecution[]> {
        const params: AWS.CodePipeline.ListPipelineExecutionsInput = {
            pipelineName: pipelineId,
            maxResults: top
        }

        return this._codePipeline.listPipelineExecutions(params).promise().then(result => {
            return _.map(result.pipelineExecutionSummaries || [], item => this._toBuildResult(pipelineId, item));
        }).catch(reason => {
            return [];
        });;
    }

    public getPipelineExecutionAsync(pipelineId: string, executionId: string): Promise<Model.PipelineExecution | null> {
        return this.getPipelineExecutionsAsync(pipelineId).then(buildResults => {
            return _.find(buildResults, item => item.id === executionId) || null;
        }).catch(reason => {
            return null;
        });
    }

    public getPipelineTestRunAsync(pipelineId: string, executionId: string, testStepId: string): Promise<Model.PipelineTestRun | null> {
        return Promise.resolve(null);
    }

    private _toBuildResult(pipelineId: string, item: AWS.CodePipeline.PipelineExecutionSummary): Model.PipelineExecution {
        const startMoment = moment(item.startTime || '');
        const endMoment = moment(item.lastUpdateTime || '');
        return {
            pipelineId: pipelineId,
            id: item.pipelineExecutionId || '',
            sequenceNumber: NaN,
            status: this._normalizeStatus(item.status || ''),
            reason: this._normalizeReason(''),
            changes: _.map(item.sourceRevisions || [], i => {
                return {
                    id: i.revisionId || '',
                    summary: i.revisionSummary || '',
                    uri: i.revisionUrl || ''
                };
            }),
            timeStarted: startMoment.toISOString(true) || '',
            duration: endMoment.diff(startMoment),
            uri: ''
        };
    }

    private _normalizeStatus(awsStatus: string): string {
        switch (awsStatus.toUpperCase()) {
            case 'FAILED':
                return 'Failed';
            case 'SUCCEEDED':
                return 'Succeeded';
            default:
                return 'Running';
        }
    }

    private _normalizeReason(awsReason: string): string {
        switch ((awsReason || '').toUpperCase()) {
            default:
                return 'Code has changed';
        }
    }
}

module.exports = AwsProvider;
