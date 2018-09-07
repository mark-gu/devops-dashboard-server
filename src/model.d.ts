export interface PipelineExecution {
    pipelineId: string;
    id: string;
    sequenceNumber: number;
    status: string;
    reason: string;
    changes: CodeChange[];
    duration: number;
    timeStarted: string;
    progress?: {
        prettyStartedTime: string;
    };
    uri: string;
}

export interface CodeChange {
    id: string;
    author?: string;
    summary?: string;
    uri?: string;
}

export interface PipelineTestRun {
    pipelineId: string;
    pipelineExecutionId: string;
    testStepId: string;
    id: string;
    status: string;
    counters: {
        all: number;
        succeeded: number;
        failed: number;
        skipped: number;
        quarantined: number;
    };
    duration: number;
    timeStarted: string;
    uri?: string;
    artifacts: {
        name: string;
        uri: string;
    }[];
    coverage?: {
        percentage: number;
        reportUri: string;
    };
}

export interface IPipelineExecutionInfoProvider {
    getPipelineExecutionsAsync(pipelineId: string, top: number): Promise<PipelineExecution[]>;
    getPipelineExecutionAsync(pipelineId: string, executionId: string): Promise<PipelineExecution | null>;
    getPipelineTestRunAsync(pipelineId: string, executionId: string, testStepId: string): Promise<PipelineTestRun | null>;
}
