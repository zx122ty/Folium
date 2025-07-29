import request from '../utils/request'
import '@renderer'
// import request from '@renderer/utils/request'

import '@/utils/request'

//用户登录
export const loginByJson = (username: string) => {
  return request({
    url: '/u/loginByJson',
    method: 'post',
    data: {
      username
    }
    //...
  })
}

// export const loginByJson = (username: string, password: string) => {
//   return request({
//     url: '/u/loginByJson',
//     method: 'post',
//     data: {
//       username,
//       password
//     },
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   })
// }
