import './App.css';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [isEnter, setIsEnter] = useState(false);
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [chatList, setChatList] = useState([]);
  const [users, setUsers] = useState([]);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('notice', (msg) => {
        console.log(msg);
        setChatList((prev) => [...prev, { message: msg }]);
      });

      socket.on('chat message', (msg) => {
        console.log(msg);
        setChatList((prev) => [...prev, msg]);
      });

      socket.on('users', (users) => {
        console.log('유저 목록');
        console.log(users);
        setUsers(users);
      });

      socket.on('dup_nickname', (msg) => {
        setIsEnter((prev) => !prev);
        alert(msg);
      });
    }

    // 클린업으로 소켓 이벤트 제거
    return () => {
      if (socket) socket.off();
    };
  }, [socket]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatList]);

  // 서버 입장
  const handleHello = (e) => {
    e.preventDefault();

    // 소켓 연결
    const newSocket = io(import.meta.env.VITE_USER_PORT, {
      withCredentials: true,
    });

    newSocket.emit('join room', { nickname: name, room });

    setSocket(newSocket);
    setIsEnter((prev) => !prev);
  };

  // 채팅창 나가기
  const handleExit = () => {
    console.log('exit from client');
    socket.disconnect();

    setIsEnter((prev) => !prev);
    setChatList([]);
    setUsers([]);
    setRoom([]);
  };

  // 채팅 입력 핸들러
  const handleMessage = (e) => {
    setMessage(e.target.value);
  };

  // 채팅 전송
  const submitMessage = () => {
    if (message.trim() === '') return;
    socket.emit('chat message', { room, message });
    setMessage('');
  };

  return (
    <div className='layout'>
      <h1>채팅 애플리케이션</h1>
      {!isEnter ? (
        <form onSubmit={handleHello}>
          <label>닉네임</label>
          <input
            type='text'
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <label>방 이름</label>
          <input
            type='text'
            onChange={(e) => setRoom(e.target.value)}
            value={room}
          />
          <button type='submit'>입장하기</button>
        </form>
      ) : (
        <>
          <div className='box'>
            <section className='user-list-section'>
              <h2>
                현재 접속중인 인원 <span>({Object.keys(users).length}명)</span>
              </h2>
              {Object.keys(users).map((item) => (
                <p key={item}>{users[item]}</p>
              ))}
            </section>
            <section className='chat-section'>
              <h2>채팅창</h2>
              <div className='chat-box' ref={chatBoxRef}>
                {chatList.map(({ nickname, message }, idx) =>
                  nickname === undefined ? (
                    <div key={idx} className='notice'>
                      {message}
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className={`${nickname === name ? 'self' : 'other'}`}
                    >
                      <div
                        className={`${
                          nickname === name ? 'self-nickname' : 'other-nickname'
                        }`}
                      >
                        {nickname}
                      </div>
                      <div className='message-bubble'>{message}</div>
                    </div>
                  )
                )}
              </div>
              <input
                type='text'
                value={message}
                onChange={handleMessage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitMessage();
                  }
                }}
              />
              <button onClick={submitMessage}>채팅 보내기</button>
            </section>
          </div>
          <button onClick={handleExit}>나가기</button>
        </>
      )}
    </div>
  );
}

export default App;
