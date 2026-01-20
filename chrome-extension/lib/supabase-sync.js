// Supabase Configuration and Sync Logic

// IMPORTANT: Replace these with your actual Supabase credentials
// Get these from Supabase Dashboard -> Settings -> API
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Import Supabase client (loaded via CDN in popup.html)
// This function is called from background.js after user logs in

export async function syncDataFromSupabase(user) {
    try {
        if (!window.supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Authenticate with Supabase using Firebase ID token
        const idToken = await user.getIdToken();

        // Set auth header
        const { data: authData, error: authError } = await window.supabase.auth.setSession({
            access_token: idToken,
            refresh_token: null
        });

        if (authError) throw authError;

        // Fetch user preferences
        const { data, error } = await window.supabase
            .from('user_preferences')
            .select('youtube_api_key, whitelist_channels')
            .eq('firebase_uid', user.uid)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            throw error;
        }

        // If no data exists, create initial record
        if (!data) {
            const { data: newData, error: insertError } = await window.supabase
                .from('user_preferences')
                .insert({
                    firebase_uid: user.uid,
                    email: user.email,
                    youtube_api_key: null,
                    whitelist_channels: []
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return newData;
        }

        return data;
    } catch (error) {
        console.error('Supabase sync error:', error);
        throw error;
    }
}

export async function updateApiKey(user, apiKey) {
    try {
        const { data, error } = await window.supabase
            .from('user_preferences')
            .update({ youtube_api_key: apiKey })
            .eq('firebase_uid', user.uid)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('API key update error:', error);
        throw error;
    }
}

export async function updateWhitelist(user, whitelist) {
    try {
        const { data, error } = await window.supabase
            .from('user_preferences')
            .update({ whitelist_channels: whitelist })
            .eq('firebase_uid', user.uid)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Whitelist update error:', error);
        throw error;
    }
}
