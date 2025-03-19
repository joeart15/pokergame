import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const REACT_APP_SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";

const socket = io(REACT_APP_SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
});

const Button = ({ children, onClick, disabled }) => (
    <button 
        className={`px-4 py-2 ${disabled 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold rounded-md transition`}
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

export default function PokerTable() {
    const [gameState, setGameState] = useState({
        players: [],
        pot: 0,
        currentBet: 0,
        phase: 'waiting',
        communityCards: [],
        currentTurn: null
    });
    const [tableId] = useState("table1");
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
        <div className="p-6 bg-gray-900 min-h-screen text-white flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-6">All-In Poker</h1>
            
            {/* Error display */}
            {error && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-md mb-4">
                    {error}
                </div>
            )}

            {/* Debug info */}
            {renderDebugInfo()}

            {/* Join table section */}
            {!playerId && (
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Enter your name"
                        className="px-4 py-2 rounded-md text-black mr-2"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <Button onClick={joinTable}>Join Table</Button>
                </div>
            )}

            {/* Game information */}
            <div className="mb-6 text-center">
                <p className="text-xl">Phase: {getPhaseText()}</p>
                <p className="text-xl">Pot: ${gameState.pot}</p>
                <p className="text-xl">Current Bet: ${gameState.currentBet}</p>
            </div>

            {/* Community cards */}
            {gameState.communityCards?.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl mb-2">Community Cards</h2>
                    <div className="flex gap-2">
                        {gameState.communityCards.map((card, i) => (
                            <Card key={i} card={card} />
                        ))}
                    </div>
                </div>
            )}

            {/* Player's hand */}
            {currentPlayer?.hand?.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl mb-2">Your Hand</h2>
                    <div className="flex gap-2">
                        {currentPlayer.hand.map((card, i) => (
                            <Card key={i} card={card} />
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            {playerId && (
                <div className="flex gap-4 mb-6">
                    <Button 
                        onClick={() => handleAction('fold')}
                        disabled={!isPlayerTurn || currentPlayer?.folded}
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

            {/* Players list */}
            <div className="w-full max-w-2xl">
                <h2 className="text-xl mb-4">Players</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameState.players.map((player) => (
                        <div 
                            key={player.id} 
                            className={`p-4 rounded-md ${
                                player.id === socket.id 
                                    ? 'bg-blue-800' 
                                    : player.folded 
                                        ? 'bg-gray-700' 
                                        : 'bg-gray-800'
                            } ${
                                gameState.currentTurn === gameState.players.findIndex(p => p.id === player.id)
                                    ? 'ring-2 ring-yellow-500'
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-bold">{player.name}</span>
                                <span>${player.chips}</span>
                            </div>
                            {player.folded && <span className="text-red-500">(Folded)</span>}
                            {player.currentBet > 0 && <span className="text-green-500">Bet: ${player.currentBet}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
