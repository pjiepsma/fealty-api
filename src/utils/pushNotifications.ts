import type { PayloadRequest } from 'payload'

interface PushNotificationData {
  [key: string]: string | number | boolean | null | undefined
}

interface PushToken {
  expoPushToken: string
  isActive?: boolean
  platform?: 'ios' | 'android'
  id?: string
}

/**
 * Send push notification to a user via Expo Push Notification API
 */
export async function sendPushNotification(
  req: PayloadRequest,
  userId: string,
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user with push tokens
    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get active push tokens
    const pushTokens = ((user.pushTokens || []) as PushToken[]).filter(
      (token) => token.isActive && token.expoPushToken
    )

    if (pushTokens.length === 0) {
      return { success: false, error: 'No active push tokens found for user' }
    }

    // Build messages array for Expo API
    const messages = pushTokens.map((token) => ({
      to: token.expoPushToken,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
    }))

    // Send to Expo Push Notification API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Expo push notification error:', errorText)
      return { success: false, error: `Expo API error: ${response.statusText}` }
    }

    const result = await response.json()

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      // Check for errors in individual messages
      const hasErrors = result.data.some(
        (item: { status?: string }) => item.status === 'error'
      )
      if (hasErrors) {
        console.warn('Some push notifications failed:', result.data)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

export type NotificationType = 'claim_success' | 'claim_error' | 'king' | 'rank_change' | 'challenge'

/**
 * Send push notification with user preference checking
 */
export async function sendPushNotificationWithPreferences(
  req: PayloadRequest,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user with notification settings
    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check user's notification preferences
    const notificationSettings = user.notificationSettings || {}

    // Map notification type to setting key
    type NotificationSettingKey = 'captureComplete' | 'kingStatusChanged' | 'leaderboardUpdate' | 'newChallenge'
    let settingKey: NotificationSettingKey | undefined
    switch (type) {
      case 'claim_success':
      case 'claim_error':
        settingKey = 'captureComplete'
        break
      case 'king':
        settingKey = 'kingStatusChanged'
        break
      case 'rank_change':
        settingKey = 'leaderboardUpdate'
        break
      case 'challenge':
        settingKey = 'newChallenge'
        break
    }

    // Check if notification is enabled (default to true if setting doesn't exist)
    const isEnabled = settingKey
      ? notificationSettings[settingKey] !== undefined && notificationSettings[settingKey] !== null
        ? notificationSettings[settingKey] === true
        : true
      : true

    if (!isEnabled) {
      return {
        success: false,
        error: `Notification disabled by user preferences (${settingKey})`,
      }
    }

    // Send notification
    return await sendPushNotification(req, userId, title, body, data)
  } catch (error) {
    console.error('Error sending push notification with preferences:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}







