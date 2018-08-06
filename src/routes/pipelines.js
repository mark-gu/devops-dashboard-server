let express = require('express');
let router = express.Router();
let responseHelper = require('../utils/HttpHelpers').ResponseHelper;

router.get('/:providerName/:pipelineId', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const pipelineId = req.params.pipelineId;
        const top = req.query.top || 10;

        const providerModule = require(`../providers/${providerName}`);
        new providerModule().getPipelineExecutionsAsync(pipelineId, top).then(values => {
            responseHelper.json(res, values);
        });
    } catch (e) {
        next(e);
    }
});

router.get('/:providerName/:pipelineId/executions/:executionId', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const pipelineId = req.params.pipelineId;
        const executionId = req.params.executionId;

        const providerModule = require(`../providers/${providerName}`);
        new providerModule().getPipelineExecutionAsync(pipelineId, executionId).then(result => {
            responseHelper.json(res, result);
        });
    } catch (e) {
        next(e);
    }
});

router.get('/:providerName/:pipelineId/executions/:executionId/test-runs/:testRunId', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const pipelineId = req.params.pipelineId;
        const executionId = req.params.executionId;
        const testRunId = req.params.testRunId;

        const providerModule = require(`../providers/${providerName}`);
        new providerModule().getTestRunAsync(pipelineId, executionId).then(result => {
            responseHelper.json(res, result);
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;