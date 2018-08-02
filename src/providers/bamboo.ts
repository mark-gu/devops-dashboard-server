import * as Interfaces from '../../typings/interfaces';
import { RequestHelper } from '../utils/HttpHelpers';

const _baseUrl: string = process.env.BAMBOO_URI || '';
const _apiUrl: string = `${_baseUrl}/rest/api/latest`;
const _auth = `Basic ${process.env.BAMBOO_AUTH_TOKEN}`;
const _headers = {
    'Content-Type': 'application/json',
    'Authorization': _auth
};

class BambooProvider implements Interfaces.IBuildResultProvider {
    public getBuildResultAsync(buildId: string): Promise<Interfaces.BuildResult | null> {
        return RequestHelper.get(`${_apiUrl}/result/${buildId}`, _headers).then((data: any) => {
            if (!data) {
                return null;
            }

            const build = data.result;
            const result: Interfaces.BuildResult = {
                projectId: data.planKey,
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

    public getBuildResultsAsync(projectId: string, top: number = 10): Promise<Interfaces.BuildResult[]> {
        const completedBuildsPromise = this._getCompletedBuildResultsAsync(projectId, top);
        const currentBuildsPromise = this._getCurrentBuildsAsync(projectId);

        return Promise.all([completedBuildsPromise, currentBuildsPromise]).then(values => {
            const arr1 = values[0] || [];
            const arr2 = values[1] || [];
            const merged = arr1.concat(arr2).sort((a, b) => b.buildNumber - a.buildNumber);

            return merged;
        });
    }

    private _getCompletedBuildResultsAsync(projectId: string, top: number): Promise<Interfaces.BuildResult[]> {
        return RequestHelper.get(`${_apiUrl}/result/${projectId}?max-results=${top}`, _headers).then((data: any) => {
            let result: Interfaces.BuildResult[] = [];

            if (data) {
                data.results.results.result.forEach((build: any) => {
                    result.push({
                        projectId: projectId,
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

    private _getCurrentBuildsAsync(projectId: string): Promise<Interfaces.BuildResult[]> {
        return RequestHelper.get(`${_baseUrl}/build/admin/ajax/getDashboardSummary.action`, _headers).then((data: any) => {
            let result: Interfaces.BuildResult[] = [];

            if (data) {
                data.builds.forEach((build: any) => {
                    if (projectId === build.planKey) {
                        result.push({
                            projectId: build.planKey,
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

    private _sanitizeBuildReason(reason: string): string {
        return reason.replace(/<a .+>(.+)<\/a>/, '$1').replace(/&lt;.+&gt;/, '').trim();
    }
}

module.exports = BambooProvider;
