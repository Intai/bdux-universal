import Common from '../utils/common-util'

export const hasUniversalStates = () => (
  Common.canUseDOM() && !!document.getElementById('universal')
)
