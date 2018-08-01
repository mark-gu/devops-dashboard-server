let express = require('express');
let router = express.Router();
let fs = require('fs');
var path = require('path');
let convert = require('../utils/Converter').Converter;
let responseHelper = require('../utils/HttpHelpers').ResponseHelper;

let _dashboardsLocation = '../../dashboards';

router.get('/:name', function (req, res, next) {
    try {
        const dashboardName = req.params.name;
        const content = fs.readFileSync(path.join(__dirname, `${_dashboardsLocation}/${dashboardName}.yml`), 'ascii');
        const obj = convert.fromYml(content);

        responseHelper.json(res, obj);
    } catch (err) {
        next(err);
    }
});

module.exports = router;