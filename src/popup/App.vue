<template>
  <div>
    <b-overlay :show="overlayAll" rounded="sm">
      <div id="register" v-if="!auth">
        <div class="main">
          <b-img class="pt-4" center fluid src="https://wsm.sun-asterisk.vn/assets/favicon-f5af8f552a74be08d01600a646dde818d60113e473607c8183c49c2ec0581528.ico" alt="Image 1"></b-img>
          <p class="sign" align="center">Đăng nhập WSM</p>
          <div class="form1">
            <input class="un" v-model="email" type="text" align="center" placeholder="email">
            <input class="pass" v-model="password" type="password" align="center" placeholder="mật khẩu">
            <button type="button" class="submit" @click="login()" align="center">Sign in</button>
            </div>
        </div>
      </div>
      <div v-if="auth">
        <b-navbar toggleable="lg" type="dark" variant="info">
          <b-navbar-brand href="#">
            {{ auth.name }}
            <b-avatar :src="auth.avatar" />
          </b-navbar-brand>
          <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
          <b-collapse id="nav-collapse" is-nav>
            <b-navbar-nav class="ml-auto">
              <b-nav-item-dropdown right>
                <template #button-content>
                  <b-icon icon="person-fill"></b-icon> <em>Tài khoản</em>
                </template>
                <b-dropdown-item @click="logout()"><b-icon icon="power" aria-hidden="true"></b-icon> Đăng xuất</b-dropdown-item>
              </b-nav-item-dropdown>
            </b-navbar-nav>
          </b-collapse>
        </b-navbar>
        <b-overlay :show="overlayOkr" rounded="sm">
          <b-container>
            <b-row>
              <p>Ghi chú trạng thái : </p>
              <p class="text-danger ml-2"> Chưa cập nhật </p>
              <p class="text-success ml-2"> Đã cập nhật </p>
              <p class="text-info ml-2"> Cập nhật dở </p>
            </b-row>
            <b-row>
              <b-collapse v-for="(item, index) in objectives" :key="index" visible id="collsa">
                <b-button
                v-if="item.info"
                v-b-toggle="'collapse-'+index"
                class="mt-1"
                block
                :variant="formatVariantStatusUpdate(item.info.update_status)"
                >
                  + {{ item.name }} <b-badge variant="warning">{{ formatOkr(item.actual) }}</b-badge></b-button>
                <b-collapse :id="'collapse-'+index" v-if="item.info && item.info.childObject">
                  <b-card v-for="(key,indexKey) in item.info.childObject" :key="indexKey" class="mt-2 font-mn" variant="outline-secondary"><b-icon icon="bullseye"></b-icon> {{ key.name }} <b-badge variant="success">{{ formatOkr(key.actual) }}</b-badge>
                  <b-progress max="100" height="2rem">
                    <b-progress-bar :value="key.actual" :variant="formatVariant(key.actual)" class="mt-1">
                      <strong>{{ formatOkr(key.actual) }} / 100%</strong>
                    </b-progress-bar>
                  </b-progress>
                  <b-form-input @change="inputRangeChange(key, index, indexKey)" v-model="key.actual" type="range" min="0" max="100" step="1"></b-form-input>
                  <b-button v-if="key.update_status === 0" @click="remainUnChange(key, index, indexKey)" size="sm" v-b-tooltip.hover title="Không có thay đổi gì">
                      <b-icon icon="clock" animation="spin-reverse" font-scale="1"></b-icon>
                    </b-button>
                  </b-card>
                </b-collapse>
              </b-collapse>
            </b-row>
          </b-container>
        </b-overlay>
      </div>
    </b-overlay>
  </div>
</template>

<script>
import Storage from './storage'
import Service from '../services/index'

export default {
  name: 'App',
  data: () => ({
    auth: null,
    email: null,
    password: null,
    show: false,
    overlayAll: false,
    err: null,
    objectives: [],
    overlayOkr: false
  }),
  computed: {},
  created () {
    this.overlayAll = true
  },
  mounted () {
    this.initAuth()
    if (this.auth) {
      this.loadOkr()
    }
  },
  methods: {
    initAuth: function () {
      if (Storage.get('auth')) {
        this.auth = Storage.get('auth')
      } else {
        this.auth = null
      }
      this.overlayAll = false
    },
    async refreshAuth () {
      if (Storage.get('wsm_account')) {
        var account = Storage.get('wsm_account')
        await Service.login(account.email, account.password)
          .then((response) => {
            Storage.set('auth', response.data)
            this.initAuth()
            this.overlayAll = false
            this.loadOkr()
          })
          .catch((errors) => {
            this.err = null
            this.err = errors
            this.$bvToast.toast(errors, {
              title: 'Xảy ra lỗi vui lòng đăng xuất và đăng nhập lại :(',
              autoHideDelay: 5000,
              variant: 'danger',
              toaster: 'b-toaster-bottom-center'
            })
            this.overlayAll = false
          })
      }
    },
    async login () {
      this.overlayAll = true
      await Service.login(this.email, this.password)
        .then((response) => {
          Storage.set('auth', response.data)
          Storage.set('wsm_account', {
            email: this.email,
            password: this.password
          })
          this.initAuth()
          this.overlayAll = false
          this.loadOkr()
        })
        .catch((errors) => {
          this.err = null
          this.err = errors
          this.$bvToast.toast(errors, {
            title: 'Xảy ra lỗi vui lòng kiểm tra lại tài khoản :(',
            autoHideDelay: 5000,
            variant: 'danger',
            toaster: 'b-toaster-bottom-center'
          })
          this.overlayAll = false
        })
    },
    logout () {
      this.overlayAll = true
      Storage.remove('auth')
      this.initAuth()
    },
    async loadOkr () {
      this.overlayOkr = true
      await Service.getOkr(
        this.auth.groups[0].id,
        this.auth.token.access_token
      ).then((response) => {
        console.log(response)
        this.objectives = response.data.objectives
        this.objectives = this.objectives.map(obj => ({ ...obj, info: null }))
        this.appendChildObj()
      })
        .catch((errors) => {
          this.refreshAuth()
        })
      this.overlayOkr = false
    },
    appendChildObj () {
      for (var i = 0; i < this.objectives.length; i++) {
        var self = this
        var el = self.objectives[i]
        this.loadChildObj(el.id, i)
      }
      console.log(this.objectives)
    },
    async loadChildObj (objId, index) {
      await Service.loadChildObj(objId, this.auth.token.access_token)
        .then((res) => {
          this.objectives[index].info = {
            update_status: res.data.update_status,
            progress_status: res.data.progressStatus,
            childObject: res.data.child_objective
          }
        })
    },
    formatOkr (value) {
      return (parseInt(value)).toFixed(0) + '%'
    },
    formatVariant (item) {
      if (item < 30) {
        return 'warning'
      }

      if (item >= 80) {
        return 'success'
      }

      return 'info'
    },
    formatVariantStatusUpdate (status) {
      if (status === 1) {
        return 'info'
      }

      if (status === 2) {
        return 'success'
      }

      return 'danger'
    },
    async inputRangeChange (item, index, indexKey) {
      this.overlayAll = true
      console.log(this.objectives[index])
      await Service.updateOkr(item.id, { actual: item.actual }, this.auth.token.access_token)
        .then((response) => {
          console.log(response)
          this.objectives[index].actual = response.data.actual
          this.objectives[index].info.update_status = response.data.update_status
          this.objectives[index].info.childObject[indexKey].update_status = 2
          this.toast('success', 'Cập nhật thành công', 'Update OKR')
        })
        .catch((errors) => {
          this.toast('error', 'Cập nhật thất bại vui lòng đăng nhập lại và thử lại', 'Update OKR')
        })
        .finally(() => {
          this.overlayAll = false
        })
    },
    async remainUnChange (item, index, indexKey) {
      this.overlayAll = true
      await Service.remainUnChange(item.id, { keyResultId: item.id }, this.auth.token.access_token)
        .then((res) => {
          this.objectives[index].info.update_status = res.objective.update_status
          this.objectives[index].info.childObject[indexKey].update_status = 2
          this.toast('success', 'Cập nhật thành công', 'Update OKR')
        })
        .catch((errors) => {
          this.toast('error', 'Cập nhật thất bại vui lòng đăng nhập lại và thử lại', 'Update OKR')
        })
        .finally(() => {
          this.overlayAll = false
        })
    },
    toast (variant = null, message = null, title = null) {
      this.$bvToast.toast(message, {
        title: title,
        variant: variant,
        solid: true,
        autoHideDelay: 3000,
        toaster: 'b-toaster-bottom-center'
      })
    }
  }
}
</script>

<style>
html {
  width: 600px;
  height: 600px;
}
.block {
  background-color: #777;
  color: white;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 15px;
}
.font-mn {
  font-size: 0.8em !important;
}
   body {
        background-color: #F3EBF6;
        font-family: 'Ubuntu', sans-serif;
    }

    .main {
        background-color: #FFFFFF;
        width: 400px;
        height: 400px;
        margin: 7em auto;
        border-radius: 1.5em;
        box-shadow: 0px 11px 35px 2px rgba(0, 0, 0, 0.14);
    }

    .sign {
        padding-top: 40px;
        color: #8C55AA;
        font-family: 'Ubuntu', sans-serif;
        font-weight: bold;
        font-size: 23px;
    }

    .un {
    width: 76%;
    color: rgb(38, 50, 56);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 1px;
    background: rgba(136, 126, 126, 0.04);
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    outline: none;
    box-sizing: border-box;
    border: 2px solid rgba(0, 0, 0, 0.02);
    margin-bottom: 50px;
    margin-left: 46px;
    text-align: center;
    margin-bottom: 27px;
    font-family: 'Ubuntu', sans-serif;
    }

    form.form1 {
        padding-top: 40px;
    }

    .pass {
            width: 76%;
    color: rgb(38, 50, 56);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 1px;
    background: rgba(136, 126, 126, 0.04);
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    outline: none;
    box-sizing: border-box;
    border: 2px solid rgba(0, 0, 0, 0.02);
    margin-bottom: 50px;
    margin-left: 46px;
    text-align: center;
    margin-bottom: 27px;
    font-family: 'Ubuntu', sans-serif;
    }

    .un:focus, .pass:focus {
        border: 2px solid rgba(0, 0, 0, 0.18) !important;

    }

    .submit {
      cursor: pointer;
        border-radius: 5em;
        color: #fff;
        background: linear-gradient(to right, #9C27B0, #E040FB);
        border: 0;
        padding-left: 40px;
        padding-right: 40px;
        padding-bottom: 10px;
        padding-top: 10px;
        font-family: 'Ubuntu', sans-serif;
        margin-left: 35%;
        font-size: 13px;
        box-shadow: 0 0 20px 1px rgba(0, 0, 0, 0.04);
    }

    .forgot {
        text-shadow: 0px 0px 3px rgba(117, 117, 117, 0.12);
        color: #E1BEE7;
        padding-top: 15px;
    }

    a {
        text-shadow: 0px 0px 3px rgba(117, 117, 117, 0.12);
        color: #E1BEE7;
        text-decoration: none
    }
</style>
