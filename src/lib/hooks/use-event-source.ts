'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

type EventSourceStatus = 'connecting' | 'connected' | 'disconnected'

interface UseEventSourceOptions {
  /** SSE 엔드포인트 URL */
  url: string
  /** 이벤트 수신 콜백 */
  onMessage: (data: unknown) => void
  /** 최대 재연결 시도 횟수 (기본값: 10) */
  maxRetries?: number
}

/**
 * EventSource API 래퍼 훅
 * - exponential backoff 재연결
 * - 자동 정리 (unmount 시)
 */
export function useEventSource({ url, onMessage, maxRetries = 10 }: UseEventSourceOptions) {
  const [status, setStatus] = useState<EventSourceStatus>('disconnected')
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)

  // 최신 콜백 참조 유지
  onMessageRef.current = onMessage

  const connectRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setStatus('connecting')
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      retryCountRef.current = 0
      setStatus('connected')
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessageRef.current(data)
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    es.onerror = () => {
      es.close()
      setStatus('disconnected')

      // exponential backoff 재연결
      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
        retryCountRef.current += 1

        retryTimerRef.current = setTimeout(() => {
          connectRef.current()
        }, delay)
      }
    }
  }, [url, maxRetries])

  connectRef.current = connect

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    retryCountRef.current = 0
    setStatus('disconnected')
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { status, disconnect, reconnect: connect }
}
