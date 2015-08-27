'use strict';

var angular = require('angular');
var _ = require('lodash');
var config = require('./config');

var ngModule = angular.module('wfm.workorder', ['wfm.core.mediator']);

require('./lib');

var getStatusIcon = function(workorder) {
  if (! workorder) {
    return '';
  }
  var statusIcon;
  switch(workorder.status) {
    case 'In Progress':
      statusIcon = 'ion-load-d';
      break;
    case 'Complete':
      statusIcon = 'ion-ios-checkmark-outline';
      break;
    case 'Aborted':
      statusIcon = 'ion-ios-close-outline';
      break;
    case 'On Hold':
      statusIcon = 'ion-ios-minus-outline';
      break;
    case 'Unassigned':
      statusIcon = 'ion-ios-help-outline';
      break;
    case 'New':
      statusIcon = 'ion-ios-plus-outline';
      break;
    default:
      statusIcon = 'ion-ios-circle-outline';
  }
  return statusIcon;
}

ngModule.factory('workOrderManager', function($timeout, $http) {
  var workOrderManager = {};
  var workorders;

  workOrderManager.getList = function(cb) {
    if (workorders) {
      cb(workorders);
    } else {
      $http.get(config.apiHost + config.apiPath).then(function(response) {
        workorders = response.data;
        cb(workorders);
      }
      , function(response) {
        console.log(response);
      });
    }
  };

  workOrderManager.get = function(id, cb) {
    $timeout(function() {
      var workorder = _.find(workorders, function(_workorder) {
        return _workorder.id == id;
      });
      cb(workorder);
    }, 0);
  };

  workOrderManager.save = function(workorder, cb) {
    $timeout(function() {
      var index = _.findIndex(workorders, function(_workorder) {
        return _workorder.id == workorder.id;
      });
      workorders[index] = workorder;
      cb(workorder);
    }, 0);
  }

  return workOrderManager;
})

.run(function(Mediator, workOrderManager) {
  Mediator.subscribe('workorder:load', self, function(data) {
    workOrderManager.get(data, function(workorder) {
      Mediator.publish('workorder:loaded', self, workorder);
    })
  });
  Mediator.subscribe('workorders:load', self, function() {
    workOrderManager.getList(function(workorders) {
      Mediator.publish('workorders:loaded', self, workorders);
    })
  });
  Mediator.subscribe('workorder:save', self, function(data) {
    workOrderManager.save(data, function(workorder) {
      Mediator.publish('workorder:saved', self, workorder);
    })
  });
})

.directive('workorder', function($templateCache, Mediator) {
  return {
    restrict: 'E'
  , template: $templateCache.get('wfm-template/workorder-view.tpl.html')
  , scope: {
      workorder: '=value'
    }
  };
})

.directive('workorderTable', function($templateCache, Mediator) {
  return {
    restrict: 'E'
  , template: $templateCache.get('wfm-template/workorder-table.tpl.html')
  , scope: {
      list : '=list'
    }
  , controller: function() {
      var self = this;
      self.selectWorkorder = function(event, workorder) {
        Mediator.publish('workorder:selected', self, workorder);
        event.preventDefault();
      }
    }
  , controllerAs: 'ctrl'
  };
})

.directive('workorderList', function($templateCache, Mediator) {
  return {
    restrict: 'E'
  , template: $templateCache.get('wfm-template/workorder-list.tpl.html')
  , scope: {
      workorders : '='
    }
  , controller: function() {
      var self = this;
      self.getStatusIcon = getStatusIcon;
      self.isWorkorderShown = function(workorder) {
        return self.shownWorkorder === workorder;
      };
      self.toggleWorkorder = function(event, workorder) {
        if (self.isWorkorderShown(workorder)) {
          self.shownWorkorder = '';
        } else {
          self.shownWorkorder = workorder;
        }
      }
    }
  , controllerAs: 'ctrl'
  };
})

.directive('workorderListItem', function($templateCache, Mediator) {
  return {
    restrict: 'E'
  , template: $templateCache.get('wfm-template/workorder-list-item.tpl.html')
  , scope: {
    workorder : '=workorder'
    }
  , controller: function($scope) {
      var self = this;
      self.showSelectButton = !! $scope.$parent.workorders;
      self.selectWorkorder = function(event, workorder) {
        Mediator.publish('workorder:selected', self, workorder);
        event.preventDefault();
      }
    }
  , controllerAs: 'ctrl'
  };
})

;

module.exports = 'wfm.workorder';