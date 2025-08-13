import {type FormEvent, useState} from 'react'
import {Mic, Eye, EyeOff, X, Loader2} from 'lucide-react'
import {useNavigate} from "react-router-dom"
import api from "../lib/api.ts"

export const LoginScreen = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null) // Error state

    const navigate = useNavigate()

    const handleLogin = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        api.loginApiAuthLoginPost({
            loginRequest: {
                username: username,
                password: password,
            }
        }).then(r => {
            console.log(r.message)
            navigate('/')
        }).catch(reason => {
            setError(reason.message)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div
                            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Mic className="w-6 h-6 text-white"/>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Vox</h1>
                    </div>
                    <p className="text-gray-400">Voice to text, simplified</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin"/>
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Switch to Signup */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400">
                        Don't have an account?{' '}
                        <button
                            onClick={() => {
                                navigate("/signup")
                            }}
                            disabled={loading}
                            className="text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>

            {/* Error Popup Modal */}
            {error && (
                <div className="fixed inset-0 flex items-center justify-center px-6 z-50">
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-sm mx-auto shadow-2xl transform transition-all duration-200 scale-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <X className="w-4 h-4 text-white"/>
                            </div>
                            <h3 className="text-lg font-semibold text-red-400">Login Failed</h3>
                        </div>
                        <p className="text-gray-300 mb-6 leading-relaxed">{error}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setError(null)}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
