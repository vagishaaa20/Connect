import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const mockMembers = [
    { id: 1, name: 'Alice', avatarInitial: 'A' },
    { id: 2, name: 'You', avatarInitial: 'Y' },
    { id: 3, name: 'Bob', avatarInitial: 'B' },
    { id: 4, name: 'Charlie', avatarInitial: 'C' },
];

const SplitBillModal = ({ isOpen, onClose }) => {
    const [totalAmount, setTotalAmount] = useState('');
    const [selectedMembers, setSelectedMembers] = useState(() => mockMembers.map(m => m.id));

    const handleMemberToggle = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const amountPerPerson = useMemo(() => {
        const amount = parseFloat(totalAmount);
        if (!amount || amount <= 0 || selectedMembers.length === 0) {
            return 0;
        }
        return amount / selectedMembers.length;
    }, [totalAmount, selectedMembers]);

    const handleSendRequest = () => {
        if (amountPerPerson > 0) {
            // In a real app, this would trigger a backend process
            console.log(`Requesting £${amountPerPerson.toFixed(2)} from ${selectedMembers.length} members.`);
            onClose();
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Split the Bill</h2>

                        <div className="mb-6">
                            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-400 mb-2">Total Amount (£)</label>
                            <div className="relative">
                                <input
                                    id="totalAmount"
                                    type="number"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-300 mb-3">Select Members</h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {mockMembers.map(member => (
                                    <div key={member.id} onClick={() => handleMemberToggle(member.id)} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-3 shrink-0 ${member.name === 'You' ? 'bg-green-500' : 'bg-indigo-500'}`}>
                                                {member.avatarInitial}
                                            </div>
                                            <span className="font-medium text-white">{member.name}</span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ${selectedMembers.includes(member.id) ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-600 border-gray-500'}`}>
                                            {selectedMembers.includes(member.id) && <Check size={16} className="text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-4 mb-6 flex justify-between items-center">
                            <span className="text-gray-400">Amount per person</span>
                            <span className="text-2xl font-bold text-white">£{amountPerPerson.toFixed(2)}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSendRequest}
                                disabled={amountPerPerson <= 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Send Request
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplitBillModal;
