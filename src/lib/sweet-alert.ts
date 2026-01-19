import Swal from 'sweetalert2'

// Toast configuration with UBA brand colors
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  },
})

export const toast = {
  success: (message: string) => {
    Toast.fire({
      icon: 'success',
      title: message,
    })
  },

  error: (message: string) => {
    Toast.fire({
      icon: 'error',
      title: message,
    })
  },

  warning: (message: string) => {
    Toast.fire({
      icon: 'warning',
      title: message,
    })
  },

  info: (message: string) => {
    Toast.fire({
      icon: 'info',
      title: message,
    })
  },
}

// Confirmation dialog
export const confirm = async (
  title: string,
  text: string,
  confirmButtonText = 'Yes',
  cancelButtonText = 'Cancel'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#D71920', // UBA Red
    cancelButtonColor: '#6b7280',
    confirmButtonText,
    cancelButtonText,
  })
  return result.isConfirmed
}

// Alert dialog
export const alert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#D71920',
    })
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#D71920',
    })
  },

  info: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#D71920',
    })
  },
}

export default Swal
