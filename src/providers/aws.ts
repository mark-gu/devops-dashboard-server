import * as Interfaces from '../../typings/interfaces';
import * as AWS from 'aws-sdk';
import moment from 'moment';

const _region = process.env.AWS_REGION || 'ap-southeast-2';

class AwsProvider implements Interfaces.IBuildResultProvider {
    constructor() {
        AWS.config.update({ region: _region });
        this._codeBuild = new AWS.CodeBuild();
    }

    private _codeBuild: AWS.CodeBuild;

    public getBuildResultAsync(buildId: string): Promise<Interfaces.BuildResult | null> {
        const params: AWS.CodeBuild.BatchGetBuildsInput = {
            ids: [buildId]
        };

        return this._codeBuild.batchGetBuilds(params).promise().then(result => {
            if (result.builds && result.builds.length) {
                const build = result.builds[0];
                const startTime = moment(build.startTime || '');
                const endTime = moment(build.endTime || '');

                return {
                    projectId: build.projectName || '',
                    buildId: buildId,
                    buildNumber: NaN,
                    status: this._normalizeBuildStatus(build.buildStatus || ''),
                    reason: build.initiator || '',
                    duration: Math.round(endTime.diff(startTime) / 1000) + ' secs',
                    timeStarted: startTime.fromNow(),
                    uri: build.logs ? build.logs.deepLink || '' : '',
                    _data: build
                };
            }

            return null;
        }).catch(reason => {
            return null;
        });
    }

    public getBuildResultsAsync(projectId: string, top: number = 10): Promise<Interfaces.BuildResult[]> {
        const params: AWS.CodeBuild.ListBuildsForProjectInput = {
            projectName: projectId
        }

        return this._codeBuild.listBuildsForProject(params).promise().then(result => {
            return <any>result;
        }).catch(reason => {
            return [];
        });;
    }

    private _normalizeBuildStatus(awsBuildStatus: string): string {
        switch (awsBuildStatus.toUpperCase()) {
            case 'FAILED':
                return 'Failed';
            case 'SUCCEEDED':
            default:
                return 'Successful';
        }
    }
}

module.exports = AwsProvider;
