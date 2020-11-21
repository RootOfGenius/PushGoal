<template lang='pug'>
div
  b-overlay(:show='overlayAll' rounded='sm')
    slide-y-down-transition(:delay='200')
      #register(v-if='!auth')
        .main
          b-img.pt-4(center='' fluid='' :src='wsmIcon' alt='WSM Icon')
          p.sign(align='center') {{ $t('auth.login_wsm') }}
          .form1
            input.un(v-model='email' type='text' align='center' :placeholder="$t('auth.email')")
            input.pass(v-model='password' type='password' align='center' :placeholder="$t('auth.password')")
            button.submit.login-btn.btn-hover.color-7.mt-2(type='button' @click='login()' align='center')
              | {{ $t('auth.login') }}
            button.submit.btn-hover.color-9.login-goal-btn.submit-goal.mt-2(type='button' @click='loadGoalAuth()' align='center')
              | {{ $t('auth.login_goal') }}
          LocaleChanger.locale-change
    slide-y-down-transition(:delay='200')
      div(v-if='auth')
        b-navbar(toggleable='lg' type='dark' variant='info')
          b-navbar-brand(href='#')
            | {{ auth.name }}
            b-avatar(:src='auth.avatar')
          b-navbar-toggle(target='nav-collapse')
          b-collapse#nav-collapse(is-nav='')
            b-navbar-nav.ml-auto
              b-nav-item-dropdown(right='')
                template(#button-content='')
                  b-icon(icon='person-fill')
                  em {{ $t('auth.account') }}
                b-dropdown-item(@click='logout()')
                  b-icon(icon='power' aria-hidden='true')
                  | {{ $t('auth.logout') }}
              b-nav-item-dropdown(right='')
                template(#button-content='')
                  b-icon(icon='flag-fill')
                  em {{ $t('common.language') }}
                b-dropdown-item
                  LocaleChanger
        b-overlay(:show='overlayOkr' rounded='sm')
          b-container
            b-row
              p {{ $t('status.label') }}
              p.text-danger.ml-2 {{ $t('status.not_update') }}
              p.text-success.ml-2 {{ $t('status.done_update') }}
              p.text-info.ml-2 {{ $t('status.progress_update') }}
            b-row.mb-4
              span.w-100(v-for='(item, index) in objectives' :key='index')
                zoom-center-transition
                  b-button.mt-1(v-if='item.info' v-b-toggle="'collapse-' + index" block='' :variant='formatVariantStatusUpdate(item.info.update_status)')
                    | + {{ item.name }} &nbsp;
                    b-badge(variant='warning')
                      countTo(:start-val='0' :end-val='parseInt(formatOkr(item.actual))' :duration='1500')
                      | %
                    | &nbsp;
                    b-badge(:variant='formatProgressObjectives(item.info.progress_status[1])') {{ item.info.progress_status[0] }}
                b-collapse(:id="'collapse-' + index" v-if='item.info && item.info.childObject')
                  b-card.mt-2.font-mn(v-for='(key, indexKey) in item.info.childObject' :key='indexKey' variant='outline-secondary')
                    b-icon(icon='bullseye')
                    |  {{ key.name }} &nbsp;
                    b-badge(variant='success')
                      | {{ formatOkr(key.actual) }}%
                    b-progress(max='100' height='2rem')
                      b-progress-bar.mt-1(:value='key.actual' :variant='formatVariant(key.actual)')
                        strong {{ formatOkr(key.actual) }}% / 100%
                    b-form-input(@change='inputRangeChange(key, index, indexKey)' v-model='key.actual' type='range' min='0' max='100' step='1')
                    .flex--center
                      .w-10(v-if='key.update_status === 0')
                        b-button(@click='remainUnChange(key, index, indexKey)' size='sm' v-b-tooltip.hover='' :title='$t("okr.no_changes")')
                          b-icon(icon='clock' animation='spin-reverse' font-scale='1')
                      .w-15
                        b-form-input(@update='valueInputChange($event, key, index, indexKey)' debounce='1500' min='0' :max='key.target' :value='convertActualToValueInput(key.actual, key.target)' type='number' size='sm')
                      .w-20.ml-2
                        | / {{ key.target }} &nbsp; {{ key.unit.unit }}
                      .w-20.ml-2.view-comment(@click='toggleCollapseView(indexKey)')
                        | {{ $t('okr.view_comments') }} ({{ key.comments.length }})
                    b-collapse(:id="'collapse-view-' + indexKey")
                      b-card.mt-2.card-top(v-for='(comment, indexComment) in key.comments' :key='indexComment' no-body='' variant='outline-secondary')
                        span.font-mm {{ comment.content }}
</template>

<script>
import Storage from './storage'
import Service from '../services/index'
import countTo from 'vue-count-to'
import jwtDecode from 'jwt-decode'
import LocaleChanger from '../components/LocaleChanger'
import { SlideYDownTransition, ZoomCenterTransition } from 'vue2-transitions'

export default {
  name: 'App',
  components: { countTo, SlideYDownTransition, ZoomCenterTransition, LocaleChanger },
  data: () => ({
    auth: null,
    email: null,
    password: null,
    show: false,
    overlayAll: false,
    err: null,
    objectives: [],
    overlayOkr: false,
    cookie: {
      access_token: null,
      refresh_token: null
    },
    wsmIcon: 'https://wsm.sun-asterisk.vn/assets/favicon-f5af8f552a74be08d01600a646dde818d60113e473607c8183c49c2ec0581528.ico'
  }),
  computed: {},
  created () {
    this.initAuth()
    if (!this.auth) {
      this.toast(
        'info',
        this.$t('auth.notice'),
        'PushGoal',
        'b-toaster-top-center'
      )
    }
  },
  mounted () {
  },
  methods: {
    initAuth: function () {
      this.overlayAll = true
      if (Storage.get('auth')) {
        this.auth = Storage.get('auth')
      } else {
        this.auth = null
      }
      if (this.auth) {
        this.loadOkr()
      }
      this.overlayAll = false
    },
    async refreshAuth () {
      console.log('Refresh auth called')
      if (Storage.get('wsm_account')) {
        console.log('Refresh auth with wsm')
        var account = Storage.get('wsm_account')
        await Service.login(account.email, account.password)
          .then((response) => {
            Storage.set('auth', response.data)
            this.initAuth()
          })
          .catch((errors) => {
            this.err = null
            this.err = errors
            this.$bvToast.toast(errors, {
              title: this.$t('errors.login_again'),
              autoHideDelay: 5000,
              variant: 'danger',
              toaster: 'b-toaster-bottom-center'
            })
            this.overlayAll = false
          })
      } else {
        console.log('Refresh auth with cookie')
        this.loadGoalAuth()
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
            title: this.$t('errors.login_validate'),
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
      await Service.getOkr(this.auth.groups[0].id, this.auth.token.access_token)
        .then((response) => {
          this.objectives = response.data.objectives
          this.objectives = this.objectives.map((obj) => ({
            ...obj,
            info: null
          }))
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
    },
    async loadChildObj (objId, index) {
      await Service.loadChildObj(objId, this.auth.token.access_token).then(
        (res) => {
          this.objectives[index].info = {
            update_status: res.data.update_status,
            progress_status: res.data.progressStatus,
            childObject: res.data.child_objective
          }
        }
      )
    },
    formatOkr (value) {
      return parseInt(value).toFixed(0)
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
    formatProgressObjectives (state) {
      if (state === 'ob-info') {
        return 'primary'
      }

      if (state === 'ob-warning') {
        return 'warning'
      }

      if (state === 'ob-success') {
        return 'success'
      }

      if (state === 'ob-danger') {
        return 'danger'
      }

      return 'info'
    },
    async inputRangeChange (item, index, indexKey) {
      this.overlayAll = true
      await Service.updateOkr(
        item.id,
        { actual: item.actual },
        this.auth.token.access_token
      )
        .then((response) => {
          this.objectives[index].actual = response.data.actual
          this.objectives[index].info.update_status =
            response.data.update_status
          this.objectives[index].info.childObject[indexKey].update_status = 2
          this.objectives[index].info.progress_status = response.data.progressStatus
          this.toast('success', this.$t('okr.update_success'), 'Update OKR')
        })
        .catch((errors) => {
          this.toast(
            'danger',
            this.$t('okr.update_fail'),
            'Update OKR'
          )
        })
        .finally(() => {
          this.overlayAll = false
        })
    },
    async remainUnChange (item, index, indexKey) {
      this.overlayAll = true
      await Service.remainUnChange(
        item.id,
        { keyResultId: item.id },
        this.auth.token.access_token
      )
        .then((res) => {
          this.objectives[index].info.update_status =
            res.objective.update_status
          this.objectives[index].info.childObject[indexKey].update_status = 2
          this.toast('success', this.$t('okr.update_success'), 'Update OKR')
        })
        .catch((errors) => {
          this.toast(
            'danger',
            this.$t('okr.update_fail'),
            'Update OKR'
          )
        })
        .finally(() => {
          this.overlayAll = false
        })
    },
    toast (variant = null, message = null, title = null, position = 'b-toaster-bottom-center') {
      this.$bvToast.toast(message, {
        title: title,
        variant: variant,
        solid: true,
        autoHideDelay: 3000,
        toaster: position
      })
    },
    convertActualToValueInput (actual, target) {
      return (target / 100 * actual).toFixed(0)
    },
    async valueInputChange (value, item, index, indexKey) {
      var actual = value * 100 / item.target
      if (value < 0) {
        actual = 0
      }

      if (value > item.target) {
        actual = 100
      }

      if (isNaN(parseInt(value))) {
        actual = 0
      }
      this.overlayAll = true
      item.actual = actual
      await Service.updateOkr(
        item.id,
        { actual: actual },
        this.auth.token.access_token
      )
        .then((response) => {
          this.objectives[index].actual = response.data.actual
          this.objectives[index].info.update_status =
            response.data.update_status
          this.objectives[index].info.childObject[indexKey].update_status = 2
          this.objectives[index].info.progress_status = response.data.progressStatus
          this.toast('success', this.$t('okr.update_success'), 'Update OKR')
        })
        .catch((errors) => {
          this.toast(
            'danger',
            this.$t('okr.update_fail'),
            'Update OKR'
          )
        })
        .finally(() => {
          this.overlayAll = false
        })
    },
    toggleCollapseView (index) {
      this.$root.$emit('bv::toggle::collapse', 'collapse-view-' + index)
    },
    getCookies (domain, name, callback) {
      chrome.cookies.get({ url: domain, name: name }, function (cookie) {
        if (callback) {
          callback(cookie)
        }
      })
    },
    async loadGoalAuth () {
      var self = this
      this.getCookies('https://goal.sun-asterisk.vn', 'refresh_token', function (cookie) {
        if (cookie) {
          Storage.set('refresh_token', cookie.value)
        }
      })
      this.getCookies('https://goal.sun-asterisk.vn', 'access_token', async function (cookie) {
        if (cookie) {
          Storage.set('access_token', cookie.value)
          var token = Storage.get('access_token')
          var tokenDecoded = jwtDecode(token)
          var userId = tokenDecoded.sub
          await Service.loadUserDetail(userId, token)
            .then((res) => {
              var auth = {
                ...res.data,
                token: {
                  access_token: Storage.get('access_token'),
                  refresh_token: Storage.get('refresh_token'),
                  token_type: 'Bearer'
                }
              }
              Storage.set('auth', auth)
              self.initAuth()
            })
            .catch((err) => {
              self.toast(
                'danger',
                self.$t('errors.login_goal'),
                self.$t('auth.fail')
              )
            })
        } else {
          self.toast(
            'danger',
            self.$t('errors.login_goal'),
            self.$t('auth.fail')
          )
        }
      })
    }
  }
}
</script>
