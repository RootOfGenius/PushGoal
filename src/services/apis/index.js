export default {
  login: (email, password) => ({
    method: 'post',
    url: '/loginwsm?email=' + email + '&password=' + password
  }),
  getOkr: (groupId) => ({
    method: 'GET',
    url: '/groups/' + groupId + '/get-okr-info-full-member'
  }),
  updateOkr: (okrId, data) => ({
    method: 'PATCH',
    url: '/objectives/' + okrId,
    data: data
  }),
  remainUnChange: (okrId, data) => ({
    method: 'POST',
    url: '/objectives/' + okrId + '/remain_unchanged',
    data: data
  }),
  loadChildObj: (idObject) => ({
    method: 'GET',
    url: '/objectives/' + idObject + '/detail_objective'
  }),
  loadUserDetail: (userId) => ({
    method: 'GET',
    url: '/users/' + userId
  })
}
