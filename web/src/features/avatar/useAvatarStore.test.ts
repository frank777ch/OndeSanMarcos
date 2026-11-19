import { AVATARS } from './avatars'
import { AVATAR_KEY, useAvatarStore } from './useAvatarStore'

describe('useAvatarStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAvatarStore.setState({ avatarId: null })
  })

  it('elige un avatar y lo recuerda', () => {
    useAvatarStore.getState().setAvatar(AVATARS[0].id)
    expect(useAvatarStore.getState().avatarId).toBe(AVATARS[0].id)
    expect(localStorage.getItem(AVATAR_KEY)).toBe(AVATARS[0].id)
  })

  it('«ninguno» lo quita y olvida la elección', () => {
    useAvatarStore.getState().setAvatar(AVATARS[0].id)
    useAvatarStore.getState().setAvatar(null)
    expect(useAvatarStore.getState().avatarId).toBeNull()
    expect(localStorage.getItem(AVATAR_KEY)).toBeNull()
  })

  it('un id que no existe en el catálogo se trata como ninguno', () => {
    useAvatarStore.getState().setAvatar('no-existe')
    expect(useAvatarStore.getState().avatarId).toBeNull()
  })
})
