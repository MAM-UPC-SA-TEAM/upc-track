// Hook legado hooks/useAuth.js (la sesión real vive en context/AuthContext).
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../src/hooks/useAuth'

const jwt = (payload) => `h.${btoa(JSON.stringify(payload))}.s`

beforeEach(() => localStorage.clear())

describe('useAuth (hook)', () => {
  it('sin token no hay usuario', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.usuario).toBeNull()
  })

  it('con token válido toma el usuario del payload', () => {
    localStorage.setItem('token', jwt({ id_usuario: 3, tipo_usuario: 'admin' }))
    const { result } = renderHook(() => useAuth())
    expect(result.current.usuario).toMatchObject({ id_usuario: 3 })
  })

  it('con token ilegible no hay usuario', () => {
    localStorage.setItem('token', 'basura')
    const { result } = renderHook(() => useAuth())
    expect(result.current.usuario).toBeNull()
  })

  it('login guarda el token y el usuario; logout los limpia', () => {
    const { result } = renderHook(() => useAuth())
    act(() => result.current.login('tok', { nombre: 'Ana' }))
    expect(localStorage.getItem('token')).toBe('tok')
    expect(result.current.usuario).toEqual({ nombre: 'Ana' })
    act(() => result.current.logout())
    expect(localStorage.getItem('token')).toBeNull()
    expect(result.current.usuario).toBeNull()
  })
})
