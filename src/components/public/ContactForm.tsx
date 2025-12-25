"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function ContactForm() {
    const handleSubmit = () => {
        toast.success('送信完了しました');
    };

    return (
        <section id="contact" className="px-6 md:px-12 py-32 bg-[#f8f8f8] border-t border-black/5">
            <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16">
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-manrope">Contact</h2>
                    <p className="text-gray-500 font-jp leading-relaxed">
                        プロジェクトのご相談、サービスに関するご質問など、<br />
                        お気軽にご連絡ください。
                    </p>
                </div>

                <form className="space-y-12">
                    <div className="group">
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-black transition-colors">Company Name</label>
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-lg font-jp focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-gray-200" placeholder="株式会社ZettAI" />
                    </div>
                    <div className="group">
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-black transition-colors">Your Name</label>
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-lg font-jp focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-gray-200" placeholder="山田 太郎" />
                    </div>
                    <div className="group">
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-black transition-colors">Email Address</label>
                        <input type="email" className="w-full bg-transparent border-b border-gray-200 py-3 text-lg font-jp focus:outline-none focus:border-black transition-colors rounded-none placeholder:text-gray-200" placeholder="hello@example.com" />
                    </div>
                    <div className="group">
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest group-focus-within:text-black transition-colors">Message</label>
                        <textarea rows={4} className="w-full bg-transparent border-b border-gray-200 py-3 text-lg font-jp focus:outline-none focus:border-black transition-colors rounded-none resize-none placeholder:text-gray-200" placeholder="ご用件をご記入ください"></textarea>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="group inline-flex items-center text-lg font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors mt-8"
                    >
                        Send Message
                        <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                </form>
            </div>
        </section>
    );
}
