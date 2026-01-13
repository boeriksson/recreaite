export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { endpoint, method = 'GET' } = body;

    if (!endpoint) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'endpoint is required' }),
      };
    }

    // Example: Call an external API
    // You can add API keys from environment variables if needed
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add your API keys here if needed:
        // 'Authorization': `Bearer ${process.env.API_KEY}`,
      },
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        success: response.ok,
        data,
      }),
    };
  } catch (error) {
    console.error('Error calling external API:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ error: 'Failed to call external API' }),
    };
  }
};
