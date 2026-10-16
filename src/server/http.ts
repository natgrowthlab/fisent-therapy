import { NextResponse } from 'next/server';

export const unauthorized = () => NextResponse.json({ status: 401, message: 'No autorizado' }, { status: 401 });
export const unavailable = (message = 'El servicio no está disponible.') => NextResponse.json({ status: 503, message }, { status: 503 });
export const response = <T>(payload: T, message = 'OK', status = 200) => NextResponse.json({ status, message, response: payload }, { status });
