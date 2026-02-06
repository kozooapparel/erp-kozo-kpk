import { NextRequest, NextResponse } from 'next/server'

/**
 * ZKTeco ADMS Protocol - Device Ping/Config Endpoint
 * 
 * Devices send GET requests to check server availability:
 * GET /iclock/getrequest?SN=DEVICE_SERIAL_NUMBER
 * 
 * Server must respond with "OK" in plain text for device to recognize it as valid.
 */

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const serialNumber = searchParams.get('SN')

    // Log the ping for debugging
    console.log(`[ADMS] Device ping received - SN: ${serialNumber}, Time: ${new Date().toISOString()}`)

    // Return OK in plain text as required by ZKTeco protocol
    return new NextResponse('OK', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
        }
    })
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    })
}
