import { login, logout, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import defAva from '@/assets/logo/logo.png'
import { getBalance } from '@/api/wms/financial'
const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      token: getToken(),
      id: '',
      name: '',
      avatar: '',
      balance: 0,
      roles: [],
      permissions: []
    }),
    actions: {
      // 登录
      login(userInfo) {
        const username = userInfo.username.trim()
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise((resolve, reject) => {
          login(username, password, code, uuid).then(res => {
            setToken(res.data.token)
            this.token = res.data.token
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise((resolve, reject) => {
          getInfo().then(async res => {
            const user = res.data.user
            const avatar = (user.avatar == "" || user.avatar == null) ? defAva : user.avatar;

            if (res.data.roles && res.data.roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = res.data.roles
              this.permissions = res.data.permissions
            } else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.id = user.userId
            this.name = user.userName
            this.avatar = avatar
            // 获取余额
            if (res.data.roles.includes('buyer')) {
              await getBalance(user.userId).then(res => {
                this.balance = res.data?.balance
              })
            }
            resolve(res)
          }).catch(error => {
            reject(error)
          })
        })
      },

      // 退出系统
      logOut() {
        return new Promise((resolve, reject) => {
          logout(this.token).then(() => {
            this.token = ''
            this.roles = []
            this.permissions = []
            removeToken()
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      }
    }
  })

export default useUserStore
