import { reactive } from 'vue'

export interface FooterActions {
  create?: () => void
  edit?: () => void
  save?: () => void
  remove?: () => void
  cancel?: () => void
}

export const footer = reactive({ editing: false, actions: {} as FooterActions })

export function useFooter(actions: FooterActions) {
  footer.editing = false
  footer.actions = actions
}
