const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, payload } = JSON.parse(event.body);

        switch (action) {
            case 'loginStudent': {
                const { id, password } = payload;
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .eq('password', password)
                    .single();

                if (error || !data) {
                    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
                }
                return { statusCode: 200, body: JSON.stringify({ user: data }) };
            }

            case 'loginAdmin': {
                const { username, password } = payload;
                const { data, error } = await supabase
                    .from('admins')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .single();

                if (error || !data) {
                    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
                }
                return { statusCode: 200, body: JSON.stringify({ admin: data }) };
            }

            case 'getStudentData': {
                const { id } = payload;
                const [user, fees, busPass] = await Promise.all([
                    supabase.from('users').select('*').eq('id', id).single(),
                    supabase.from('fees').select('*').eq('user_id', id),
                    supabase.from('bus_pass').select('*').eq('user_id', id).single()
                ]);

                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        user: user.data,
                        fees: fees.data,
                        busPass: busPass.data
                    })
                };
            }

            case 'getAllStudents': {
                const { data, error } = await supabase.from('users').select('*');
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ students: data }) };
            }

            case 'addStudent': {
                const { student } = payload;
                const { data, error } = await supabase.from('users').insert([student]);
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
            }

            case 'updateStudent': {
                const { id, updates } = payload;
                const { data, error } = await supabase.from('users').update(updates).eq('id', id);
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
            }

            case 'deleteStudent': {
                const { id } = payload;
                const { error } = await supabase.from('users').delete().eq('id', id);
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ success: true }) };
            }

            case 'getNotices': {
                const { data, error } = await supabase.from('notices').select('*').order('date', { ascending: false });
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ notices: data }) };
            }

            case 'addNotice': {
                const { notice } = payload;
                const { data, error } = await supabase.from('notices').insert([notice]);
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
            }

            case 'deleteNotice': {
                const { id } = payload;
                const { error } = await supabase.from('notices').delete().eq('id', id);
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ success: true }) };
            }

            // Fallback for custom queries directly from frontend (if needed, but usually discouraged due to security)
            case 'rawSupabaseQuery': {
                const { table, queryType, match, select } = payload;
                let query = supabase.from(table)[queryType](payload.insertData || payload.updateData);
                if (match) query = query.match(match);
                if (select) query = query.select(select);
                
                const { data, error } = await query;
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ data }) };
            }

            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
        }
    } catch (error) {
        console.error('API Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
