
import axios from 'axios'
import API from './apis'

const BASE_URL = 'https://goal.sun-asterisk.vn/api/v1/'

const request = async (api, token) => {
  const baseAxios = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`
    },
    validateStatus: status => status >= 200 && status < 500
  })
  const response = await baseAxios.request(api)
  const { data, status } = response
  if (status && status === 200) {
    return data
  }
  throw data.description.join(', ')
}

export default {
  login: (email, password) => request(API.login(email, password), null),
  getOkr: (groupId, token) => request(API.getOkr(groupId), token),
  updateOkr: (okrId, data, token) => request(API.updateOkr(okrId, data), token),
  remainUnChange: (okrId, data, token) => request(API.remainUnChange(okrId, data), token),
  loadChildObj: (objId, token) => request(API.loadChildObj(objId), token)
}
