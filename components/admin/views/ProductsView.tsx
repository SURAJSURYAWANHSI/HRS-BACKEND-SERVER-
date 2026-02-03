import React, { useState } from 'react';
import { ShoppingBag, Plus, Edit, Trash2, Package } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    price: number;
    stock: number;
}

const DEMO_PRODUCTS: Product[] = [
    { id: '1', name: 'Control Panel Housing', code: 'CP-001', category: 'Enclosures', description: 'Standard control panel housing', price: 5000, stock: 25 },
    { id: '2', name: 'Junction Box', code: 'JB-002', category: 'Boxes', description: 'Industrial junction box', price: 1500, stock: 50 },
    { id: '3', name: 'Server Rack', code: 'SR-003', category: 'Racks', description: '42U server rack', price: 15000, stock: 10 },
];

export const ProductsView: React.FC = () => {
    const [products] = useState<Product[]>(DEMO_PRODUCTS);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800/50 shadow-2xl flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="bg-indigo-600 p-5 rounded-3xl shadow-2xl">
                        <ShoppingBag size={32} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Products</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">Product Catalog Management</p>
                    </div>
                </div>
                <button className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg flex items-center gap-2">
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="text-indigo-100" size={24} />
                        <span className="text-indigo-100 text-xs font-black uppercase">Total</span>
                    </div>
                    <p className="text-4xl font-black text-white">{products.length}</p>
                    <p className="text-indigo-100 text-sm font-bold mt-1">Products</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="text-emerald-100" size={24} />
                        <span className="text-emerald-100 text-xs font-black uppercase">In Stock</span>
                    </div>
                    <p className="text-4xl font-black text-white">{products.filter(p => p.stock > 0).length}</p>
                    <p className="text-emerald-100 text-sm font-bold mt-1">Available</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="text-blue-100" size={24} />
                        <span className="text-blue-100 text-xs font-black uppercase">Categories</span>
                    </div>
                    <p className="text-4xl font-black text-white">{new Set(products.map(p => p.category)).size}</p>
                    <p className="text-blue-100 text-sm font-bold mt-1">Types</p>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black">{product.code}</span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">{product.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{product.category}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-200 transition-all">
                                    <Edit size={16} />
                                </button>
                                <button className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg hover:bg-rose-200 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{product.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Price</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">₹{product.price.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold">Stock</p>
                                <p className={`text-2xl font-black ${product.stock > 10 ? 'text-emerald-600' : 'text-orange-600'}`}>{product.stock}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
