import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import React from 'react';
import VideoChat from './VideoChat';
import { collegeTheme } from '../theme/collegeTheme';
import '../styles/PokerTable.css';

const REACT_APP_SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";

const socket = io(REACT_APP_SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
});

const Button = ({ children, onClick, disabled, variant = 'primary' }) => (
    <button 
        className={`px-4 py-2 rounded-md transition font-bold ${
            disabled 
                ? 'bg-gray-500 cursor-not-allowed' 
                : variant === 'primary'
                    ? `bg-[${collegeTheme.buttons.primary.background}] hover:bg-[${collegeTheme.buttons.primary.hover}] text-[${collegeTheme.buttons.primary.text}]`
                    : `bg-[${collegeTheme.buttons.secondary.background}] hover:bg-[${collegeTheme.buttons.secondary.hover}] text-[${collegeTheme.buttons.secondary.text}]`
        }`}
        onClick={onClick}
        disabled={disabled}
    >
        {children}
    </button>
);

const Card = ({ card }) => {
    if (!card) {
        console.log("No card data provided to Card component");
        return <div className="bg-gray-300 p-2 rounded-md shadow-md inline-flex items-center justify-center w-12 h-16 m-1">🂠</div>;
    }
    
    const { suit, value } = card;
    console.log("Rendering card:", suit, value);
    
    const suitSymbol = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    }[suit];
    
    const color = suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
    
    return (
        <div className={`${color} bg-white p-2 rounded-md shadow-md inline-flex items-center justify-center w-12 h-16 m-1 font-bold`}>
            {value}{suitSymbol}
        </div>
    );
};

const PokerTable = ({ username, tableId, ...props }) => {
    const [gameState, setGameState] = useState({
        players: [],
        pot: 0,
        currentBet: 0,
        phase: 'waiting',
        communityCards: [],
        currentTurn: null
    });
    const [playerId, setPlayerId] = useState("");
    const [error, setError] = useState("");
    const [playerName, setPlayerName] = useState("");

    useEffect(() => {
        socket.on("updateTable", (table) => {
            console.log("Received table update:", table);
            const currentPlayerHand = table.players.find(p => p.id === socket.id)?.hand;
            console.log("Current player hand:", currentPlayerHand);
            console.log("Community cards:", table.communityCards);
            setGameState(table);
            setError(""); // Clear any previous errors
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
            setError(error.message);
            // Clear error after 3 seconds
            setTimeout(() => setError(""), 3000);
        });

        socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
            setError("Failed to connect to server");
        });

        return () => {
            socket.off("updateTable");
            socket.off("error");
            socket.off("connect_error");
        };
    }, []);

    const joinTable = () => {
        if (!playerName.trim()) {
            setError("Please enter a name");
            return;
        }
        const player = { name: playerName };
        setPlayerId(socket.id);
        socket.emit("joinTable", tableId, player);
    };

    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    const isPlayerTurn = currentPlayer && gameState.currentTurn === gameState.players.findIndex(p => p.id === socket.id);

    const handleAction = (action, amount = null) => {
        socket.emit("playerAction", { 
            tableId, 
            action, 
            amount: amount || gameState.currentBet 
        });
    };

    const getPhaseText = () => {
        switch(gameState.phase) {
            case 'waiting': return 'Waiting for players...';
            case 'preflop': return 'Pre-flop';
            case 'flop': return 'Flop';
            case 'turn': return 'Turn';
            case 'river': return 'River';
            default: return gameState.phase;
        }
    };

    // Add this debug function
    const renderDebugInfo = () => {
        if (!currentPlayer) return null;
        return (
            <div className="text-xs text-gray-400 mt-2">
                <p>Your ID: {socket.id}</p>
                <p>Hand data: {JSON.stringify(currentPlayer.hand)}</p>
                <p>Community cards: {JSON.stringify(gameState.communityCards)}</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen text-white flex flex-col items-center" 
             style={{ 
                 background: collegeTheme.colors.background,
                 fontFamily: collegeTheme.fonts.primary 
             }}>
            {/* Header Section */}
            <div className="w-full p-6 shadow-lg" style={{ background: collegeTheme.colors.primary }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-4xl font-bold" style={{ fontFamily: collegeTheme.fonts.heading }}>
                        {collegeTheme.branding.welcomeMessage}
                    </h1>
                    <p style={{ color: collegeTheme.colors.secondary }} className="text-xl">
                        {collegeTheme.branding.tagline}
                    </p>
                </div>
            </div>

            <VideoChat username={username} tableId={tableId} />

            {/* Error display with college theme */}
            {error && (
                <div className="bg-red-500 text-white px-6 py-3 rounded-lg mb-6 shadow-lg">
                    {error}
                </div>
            )}

            {/* Debug info */}
            {renderDebugInfo()}

            {/* Join table section with college theme */}
            {!playerId && (
                <div className="mb-8 p-6 rounded-lg shadow-xl" style={{ background: collegeTheme.colors.accent }}>
                    <h2 className="text-2xl mb-4" style={{ fontFamily: collegeTheme.fonts.heading }}>
                        Join the Game
                    </h2>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        className="px-4 py-2 rounded-md text-black mr-4"
                        style={{ borderColor: collegeTheme.colors.secondary, borderWidth: 2 }}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <Button onClick={joinTable}>Join Table</Button>
                </div>
            )}

            {/* Game information with college theme */}
            <div className="mb-8 text-center p-6 rounded-lg shadow-xl" style={{ background: collegeTheme.colors.accent }}>
                <p className="text-2xl mb-2">Phase: {getPhaseText()}</p>
                <p className="text-3xl" style={{ color: collegeTheme.colors.secondary }}>Pot: ${gameState.pot}</p>
                <p className="text-xl">Current Bet: ${gameState.currentBet}</p>
            </div>

            {/* Community cards with college theme */}
            {gameState.communityCards?.length > 0 && (
                <div className="mb-8 p-6 rounded-lg shadow-xl" 
                     style={{ 
                         background: collegeTheme.table.felt,
                         borderColor: collegeTheme.table.border,
                         borderWidth: 2
                     }}>
                    <h2 className="text-2xl mb-4" style={{ fontFamily: collegeTheme.fonts.heading }}>
                        Community Cards
                    </h2>
                    <div className="flex gap-4">
                        {gameState.communityCards.map((card, i) => (
                            <Card key={i} card={card} />
                        ))}
                    </div>
                </div>
            )}

            {/* Player's hand with college theme */}
            {currentPlayer?.hand?.length > 0 && (
                <div className="mb-8 p-6 bg-[${collegeTheme.table.felt}] rounded-lg shadow-xl border-2 border-[${collegeTheme.table.border}]">
                    <h2 className="text-2xl mb-4" style={{ fontFamily: collegeTheme.fonts.heading }}>
                        Your Hand
                    </h2>
                    <div className="flex gap-4">
                        {currentPlayer.hand.map((card, i) => (
                            <Card key={i} card={card} />
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons with college theme */}
            {playerId && (
                <div className="flex gap-6 mb-8">
                    <Button 
                        onClick={() => handleAction('fold')}
                        disabled={!isPlayerTurn || currentPlayer?.folded}
                        variant="secondary"
                    >
                        Fold
                    </Button>
                    <Button 
                        onClick={() => handleAction('call')}
                        disabled={!isPlayerTurn || currentPlayer?.folded || currentPlayer?.chips < gameState.currentBet}
                    >
                        Call ${gameState.currentBet}
                    </Button>
                    <Button 
                        onClick={() => handleAction('raise', gameState.currentBet * 2)}
                        disabled={!isPlayerTurn || currentPlayer?.folded || currentPlayer?.chips < gameState.currentBet * 2}
                    >
                        Raise to ${gameState.currentBet * 2}
                    </Button>
                </div>
            )}

            {/* Players list with college theme */}
            <div className="w-full max-w-4xl mb-8">
                <h2 className="text-2xl mb-6" style={{ fontFamily: collegeTheme.fonts.heading }}>
                    Players at the Table
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gameState.players.map((player) => (
                        <div 
                            key={player.id} 
                            className={`p-6 rounded-lg shadow-xl ${
                                player.id === socket.id 
                                    ? `bg-[${collegeTheme.colors.primary}]` 
                                    : player.folded 
                                        ? 'bg-gray-700' 
                                        : `bg-[${collegeTheme.colors.accent}]`
                            } ${
                                gameState.currentTurn === gameState.players.findIndex(p => p.id === player.id)
                                    ? `ring-4 ring-[${collegeTheme.colors.secondary}]`
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xl font-bold">{player.name}</span>
                                <span className="text-[${collegeTheme.colors.secondary}] text-lg">
                                    ${player.chips}
                                </span>
                            </div>
                            {player.folded && (
                                <span className="text-red-500 font-bold">(Folded)</span>
                            )}
                            {player.currentBet > 0 && (
                                <span className="text-[${collegeTheme.colors.secondary}]">
                                    Bet: ${player.currentBet}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer with college theme */}
            <footer className="w-full p-4 mt-auto" style={{ background: collegeTheme.colors.primary }}>
                <div className="text-center text-sm">
                    {collegeTheme.branding.footer}
                </div>
            </footer>
        </div>
    );
};

export default PokerTable;
