let express = require('express');
let router = express.Router();
let responseHelper = require('../utils/HttpHelpers').ResponseHelper;

router.get('/:providerName/:planId', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const planId = req.params.planId;
        const top = req.query.top || 10;

        const providerModule = require(`../providers/${providerName}`);
        const provider = new providerModule();

        const completedBuildsPromise = provider.getCompletedBuildResultsAsync(planId, top);
        const currentBuildsPromise = provider.getCurrentBuildsAsync(planId);

        Promise.all([completedBuildsPromise, currentBuildsPromise]).then(values => {
            const arr1 = values[0] || [];
            const arr2 = values[1] || [];
            const merged = arr1.concat(arr2).sort((a, b) => b.buildNumber - a.buildNumber);

            responseHelper.json(res, merged);
        });
    } catch (e) {
        next(e);
    }
});

router.get('/:providerName/:planId/:buildNumber', (req, res, next) => {
    try {
        const providerName = req.params.providerName;
        const planId = req.params.planId;
        const buildNumber = req.params.buildNumber;

        const providerModule = require(`../providers/${providerName}`);
        new providerModule().getBuildResultAsync(planId, buildNumber).then(result => {
            responseHelper.json(res, result);
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;