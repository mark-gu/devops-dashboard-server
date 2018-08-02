let express = require('express');
let router = express.Router();
let responseHelper = require('../utils/HttpHelpers').ResponseHelper;

router.get('/:providerName/projects/:projectId', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const projectId = req.params.projectId;
        const top = req.query.top || 10;

        const providerModule = require(`../providers/${providerName}`);
        const provider = new providerModule();

        provider.getBuildResultsAsync(projectId, top).then(values => {
            responseHelper.json(res, values);
        });
    } catch (e) {
        next(e);
    }
});

router.get('/:providerName/builds/:buildId', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const buildId = req.params.buildId;

        const providerModule = require(`../providers/${providerName}`);
        new providerModule().getBuildResultAsync(buildId).then(result => {
            responseHelper.json(res, result);
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;