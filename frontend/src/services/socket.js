import { io } from 'socket.io-client'

const BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

const socket = io(BASE_URL, {
  autoConnect: false,
  auth: {
    get token() {
      return localStorage.getItem('token')
    },
  },
})

export default socket