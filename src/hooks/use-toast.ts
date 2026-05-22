import * as React from "react"

type ToastVariant = "default" | "destructive"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...newToast, id }])
    
    // 3秒后自动消失
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return React.createElement(
    ToastContext.Provider,
    { value: { toasts, toast, dismiss } },
    children,
    // Toast 容器
    React.createElement(
      'div',
      { className: "fixed bottom-4 right-4 z-50 flex flex-col gap-2" },
      toasts.map((t) =>
        React.createElement(
          'div',
          {
            key: t.id,
            className: `rounded-lg border px-4 py-3 shadow-lg transition-all ${
              t.variant === "destructive"
                ? "border-red-500 bg-red-50 text-red-900"
                : "border-gray-200 bg-white text-gray-900"
            }`
          },
          t.title && React.createElement('div', { className: "font-semibold" }, t.title),
          t.description && React.createElement('div', { className: "text-sm opacity-90" }, t.description)
        )
      )
    )
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast: (t: Omit<Toast, "id">) => {
        console.log("Toast:", t)
        alert(t.title + (t.description ? `\n${t.description}` : ""))
      },
      toasts: [],
      dismiss: () => {},
    }
  }
  return context
}
