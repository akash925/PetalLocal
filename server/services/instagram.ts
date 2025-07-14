// Using built-in fetch (Node.js 18+) instead of node-fetch

interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

interface InstagramAuthResult {
  success: boolean;
  profile?: InstagramProfile;
  error?: string;
}

class InstagramService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private isEnabled: boolean;

  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || '';
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || '';
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';
    this.isEnabled = !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(): string {
    if (!this.isEnabled) {
      throw new Error('Instagram authentication not configured');
    }

    const scopes = 'user_profile,user_media';
    const state = Math.random().toString(36).substring(2, 15);
    
    return `https://api.instagram.com/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${scopes}&` +
      `response_type=code&` +
      `state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<string | null> {
    if (!this.isEnabled) {
      console.log('[INSTAGRAM] Service disabled - no credentials');
      return null;
    }

    try {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code,
        }),
      });

      const data = await response.json() as any;
      
      if (data.access_token) {
        return data.access_token;
      }
      
      console.error('[INSTAGRAM] Token exchange failed:', data);
      return null;
    } catch (error) {
      console.error('[INSTAGRAM] Token exchange error:', error);
      return null;
    }
  }

  async getUserProfile(accessToken: string): Promise<InstagramAuthResult> {
    if (!this.isEnabled) {
      return { success: false, error: 'Instagram authentication not configured' };
    }

    try {
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );

      const data = await response.json() as any;
      
      if (data.error) {
        console.error('[INSTAGRAM] Profile fetch failed:', data.error);
        return { success: false, error: data.error.message };
      }

      return {
        success: true,
        profile: {
          id: data.id,
          username: data.username,
          account_type: data.account_type,
          media_count: data.media_count,
        },
      };
    } catch (error) {
      console.error('[INSTAGRAM] Profile fetch error:', error);
      return { success: false, error: 'Failed to fetch Instagram profile' };
    }
  }

  async validateHandle(handle: string): Promise<boolean> {
    // Basic validation for Instagram handle format
    const instagramHandleRegex = /^[a-zA-Z0-9_]{1,30}$/;
    return instagramHandleRegex.test(handle.replace('@', ''));
  }
}

export const instagramService = new InstagramService();