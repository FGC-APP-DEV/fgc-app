"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGIN = exports.GET_JUDGES = exports.GET_EVENT_SCHEDULE = exports.GET_ANNOUNCEMENTS = exports.GET_INTERVIEWS = exports.GET_TEAMS = exports.useLazyQuery = exports.useMutation = exports.useQuery = void 0;
const core_1 = require("@apollo/client/core");
var react_1 = require("@apollo/client/react");
Object.defineProperty(exports, "useQuery", { enumerable: true, get: function () { return react_1.useQuery; } });
Object.defineProperty(exports, "useMutation", { enumerable: true, get: function () { return react_1.useMutation; } });
Object.defineProperty(exports, "useLazyQuery", { enumerable: true, get: function () { return react_1.useLazyQuery; } });
exports.GET_TEAMS = (0, core_1.gql) `
  query GetTeams {
    teams {
      id
      name
      panel
      status
      score
      notebookStatus
      divergence
      flag
    }
  }
`;
exports.GET_INTERVIEWS = (0, core_1.gql) `
  query GetInterviews {
    interviews {
      id
      teamId
      teamName
      scheduleTime
      room
      status
      minutesUntil
    }
  }
`;
exports.GET_ANNOUNCEMENTS = (0, core_1.gql) `
  query GetAnnouncements {
    announcements {
      id
      type
      text
      timeDisplay
      createdAt
    }
  }
`;
exports.GET_EVENT_SCHEDULE = (0, core_1.gql) `
  query GetEventSchedule {
    eventSchedule {
      id
      timeDisplay
      eventName
      status
      sortOrder
    }
  }
`;
exports.GET_JUDGES = (0, core_1.gql) `
  query GetJudges {
    judges {
      id
      name
      panel
      completed
      total
      status
    }
  }
`;
exports.LOGIN = (0, core_1.gql) `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      expiresAt
      user {
        id
        email
        name
        role
        panel
      }
    }
  }
`;
//# sourceMappingURL=index.js.map