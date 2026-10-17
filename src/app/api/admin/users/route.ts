import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { logActivity } from '@/services/audit.service';

export async function GET() {
  try {
    const listResult = await adminAuth.listUsers(1000);
    const users = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      disabled: u.disabled,
      creationTime: u.metadata?.creationTime,
      lastSignInTime: u.metadata?.lastSignInTime,
    }));

    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pengguna';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const newUser = await adminAuth.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName?.trim() || undefined,
      emailVerified: true,
    });

    await logActivity({
      action: 'CREATE_USER',
      details: `Membuat akun admin via API: ${newUser.email} (UID: ${newUser.uid})`,
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        disabled: newUser.disabled,
        creationTime: newUser.metadata?.creationTime,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat pengguna baru';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Parameter uid wajib disertakan.' },
        { status: 400 }
      );
    }

    await adminAuth.deleteUser(uid);

    await logActivity({
      action: 'DELETE_USER',
      details: `Menghapus akun admin via API (UID: ${uid})`,
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus pengguna';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
