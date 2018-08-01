import * as Interfaces from '../../typings/interfaces';
import { RequestHelper } from '../utils/HttpHelpers';

const _baseUrl: string = process.env.BAMBOO_URI || '';
const _apiUrl: string = `${_baseUrl}/rest/api/latest`;
const _auth = `Basic ${process.env.BAMBOO_AUTH_TOKEN}`;
const _headers = {
    'Content-Type': 'application/json',
    'Authorization': _auth
};

class BambooProvider implements Interfaces.IBuildResultProvider, Interfaces.ITestResultProvider {
    public getBuildResultAsync(planId: string, buildNumber: number): Promise<Interfaces.BuildResult | null> {
        return RequestHelper.get(`${_apiUrl}/result/${planId}-${buildNumber}`, _headers).then((data: any) => {
            if (!data) {
                return null;
            }

            const build = data.result;
            const result: Interfaces.BuildResult = {
                planId: planId,
                buildId: build.buildResultKey,
                buildNumber: parseInt(build.buildNumber),
                status: build.buildState.replace('Unknown', 'Building'),
                reason: this._sanitizeBuildReason(build.buildReason),
                timeStarted: build.buildRelativeTime,
                duration: build.buildDurationDescription,
                uri: `${_baseUrl}/browse/${build.buildResultKey}`
            };

            if (build.progress) {
                result.progress = {
                    prettyStartedTime: build.progress.prettyStartedTime
                };
            }

            return result;
        });
    }

    public getCompletedBuildResultsAsync(planId: string, top: number = 10): Promise<Interfaces.BuildResult[]> {
        return RequestHelper.get(`${_apiUrl}/result/${planId}?max-results=${top}`, _headers).then((data: any) => {
            let result: Interfaces.BuildResult[] = [];

            if (data) {
                data.results.results.result.forEach((build: any) => {
                    result.push({
                        planId: planId,
                        buildId: build.buildResultKey,
                        buildNumber: parseInt(build.buildNumber),
                        status: build.buildState,
                        uri: `${_baseUrl}/browse/${build.buildResultKey}`,
                        reason: '',
                        timeStarted: '',
                        duration: ''
                    });
                });
            }

            return result;
        })
    }

    public getCurrentBuildsAsync(planId: string): Promise<Interfaces.BuildResult[]> {
        return RequestHelper.get(`${_baseUrl}/build/admin/ajax/getDashboardSummary.action`, _headers).then((data: any) => {
            let result: Interfaces.BuildResult[] = [];

            if (data) {
                data.builds.forEach((build: any) => {
                    if (planId === build.planKey) {
                        result.push({
                            planId: build.planKey,
                            buildId: build.planResultKey,
                            buildNumber: parseInt(build.buildNumber),
                            status: 'Building',
                            reason: this._sanitizeBuildReason(build.triggerReason),
                            timeStarted: '',
                            duration: build.messageText,
                            uri: `${_baseUrl}/browse/${build.buildResultKey}`,
                            progress: {
                                prettyStartedTime: build.messageText
                            }
                        });
                    }
                });
            }

            return result;
        })
    }

    public getTestResultAsync(planId: string, buildNumber: number, testId: string): Promise<Interfaces.TestResult> {
        throw new Error("Method not implemented.");
    }

    private _sanitizeBuildReason(reason: string): string {
        return reason.replace(/<a .+>(.+)<\/a>/, '$1').replace(/&lt;.+&gt;/, '').trim();
    }
}

module.exports = BambooProvider;
