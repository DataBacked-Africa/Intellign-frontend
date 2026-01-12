"use client"
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useRouter } from 'next/navigation'
import { showToast } from '../ui/CustomToast'

const NavBar = () => {
    const router = useRouter();
    const { isAuthenticated, logout } = useUserStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        showToast.success('Logged Out', 'See you next time!');
        router.push('/auth/login');
    };
    return (
        <div className='py-5  px-10 border-b-2 border-gray-50' >
            <div className='flex mx-auto items-center justify-between  max-w-7xl '>
                <Image src="/./logo.png" alt="Logo" width={100} height={100} />

                {mounted && isAuthenticated ? (
                    <button
                        onClick={handleLogout}
                        className='bg-transparent border-2 border-[#5c1427] text-[#5c1427] px-10 py-3 rounded-full hover:bg-[#5c1427] hover:text-white transition-all duration-300 font-medium'
                    >
                        Logout
                    </button>
                ) : (
                    <Link href="/auth/login">
                        <button className='bg-[#5c1427] text-white px-10 py-3 rounded-full hover:bg-[#7a1b34] transition-colors'>
                            Login
                        </button>
                    </Link>
                )}
            </div>
        </div>
    )
}

export default NavBar