<template lang='pug'>
  .locale-changer
    span.flag-icon.flag-icon-vn(@click='setLocale("vi")')
    span.flag-icon.flag-icon-us(@click='setLocale("en")')
</template>

<script>
import Storage from '../popup/storage'

export default {
  name: 'locale-changer',
  data () {
    return {
      langs: [
        { icon: 'vn', value: 'vi', html: '<span class="flag-icon flag-icon-vn"></span>VI' },
        { icon: 'us', value: 'en', html: '<span class="flag-icon flag-icon-us"></span>US' }
      ]
    }
  },
  methods: {
    setLocale (value) {
      this.$i18n.locale = value
      Storage.set('locale', value)
    }
  }
}
</script>
