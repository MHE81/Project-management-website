import { ref, watch } from 'vue'

/**
 * Composable for auto-dismissing reactive values after a specified timeout
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in milliseconds (default: 10000)
 * @param {Function} options.onDismiss - Optional callback when value is dismissed
 * @returns {Object} - Object with dismiss function and reactive values
 */
export function useAutoDismiss(options = {}) {
  const { timeout = 3000, onDismiss } = options
  const timeoutId = ref(null)

  /**
   * Sets up auto-dismiss for a reactive value
   * @param {Ref} valueRef - The reactive reference to auto-dismiss
   * @param {number} customTimeout - Optional custom timeout for this specific value
   */
  const setupAutoDismiss = (valueRef, customTimeout = timeout) => {
    // Clear any existing timeout
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }

    // Watch for changes to the value
    watch(
      valueRef,
      (newValue) => {
        if (newValue) {
          // Set up auto-dismiss when value becomes truthy
          timeoutId.value = setTimeout(() => {
            valueRef.value = ''
            if (onDismiss) {
              onDismiss()
            }
          }, customTimeout)
        } else {
          // Clear timeout when value becomes falsy
          if (timeoutId.value) {
            clearTimeout(timeoutId.value)
            timeoutId.value = null
          }
        }
      },
      { immediate: true },
    )
  }

  /**
   * Manually dismiss a value and clear its timeout
   * @param {Ref} valueRef - The reactive reference to dismiss
   */
  const dismiss = (valueRef) => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
    valueRef.value = ''
  }

  /**
   * Clear all timeouts
   */
  const clearAllTimeouts = () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
  }

  return {
    setupAutoDismiss,
    dismiss,
    clearAllTimeouts,
  }
}
