import React, { useEffect, useMemo, useState } from 'react';

const MAX_REPLY_LENGTH = 200;

const EMOTIONS = [
  { id: 'confused', label: 'Confused', emoji: '😕' },
  { id: 'lonely', label: 'Lonely', emoji: '😔' },
  { id: 'angry', label: 'Angry', emoji: '😠' },
  { id: 'embarrassed', label: 'Embarrassed', emoji: '😳' },
  { id: 'stressed', label: 'Stressed', emoji: '😰' }
];

const randomPrompts = [
  'What is one dilemma you have been overthinking lately?',
  'Describe a situation where you felt misunderstood.',
  'What tough choice are you afraid to make?',
  'What is something you wish you could tell someone anonymously?',
  "What's a small worry that feels big in your head right now?"
];

function generateAnonymousId() {
  const existing = localStorage.getItem('shadowtalk-anon-id');
  if (existing) return existing;
  const id = 'shadow-' + Math.random().toString(36).substring(2, 8);
  localStorage.setItem('shadowtalk-anon-id', id);
  return id;
}

function getRandomPrompt() {
  const index = Math.floor(Math.random() * randomPrompts.length);
  return randomPrompts[index];
}

function App() {
  const [anonId, setAnonId] = useState('');
  const [dilemmaText, setDilemmaText] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [userEmotionRoom, setUserEmotionRoom] = useState(null);
  const [dilemmas, setDilemmas] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [prompt, setPrompt] = useState(getRandomPrompt);
  const [shadowMode, setShadowMode] = useState(false);
  const [panicHidden, setPanicHidden] = useState(false);

  useEffect(() => {
    setAnonId(generateAnonymousId());
    const savedEmotion = localStorage.getItem('shadowtalk-emotion-room');
    if (savedEmotion) {
      setUserEmotionRoom(savedEmotion);
    }
  }, []);

  const selectedDilemma = useMemo(
    () => dilemmas.find((d) => d.id === selectedId) || null,
    [dilemmas, selectedId]
  );

  const filteredDilemmas = useMemo(() => {
    if (!userEmotionRoom) return dilemmas;
    return dilemmas.filter((d) => d.emotion === userEmotionRoom);
  }, [dilemmas, userEmotionRoom]);

  const trendingDilemmas = useMemo(() => {
    const sorted = [...filteredDilemmas].sort(
      (a, b) => (b.totalTokens || 0) - (a.totalTokens || 0)
    );
    return sorted.slice(0, 3);
  }, [filteredDilemmas]);

  function handlePostDilemma(e) {
    e.preventDefault();
    const trimmed = dilemmaText.trim();
    if (!trimmed || !selectedEmotion) return;
    const newDilemma = {
      id: Date.now().toString(),
      text: trimmed,
      emotion: selectedEmotion,
      createdAt: new Date().toISOString(),
      authorId: anonId,
      replies: [],
      totalTokens: 0
    };
    setDilemmas((prev) => [newDilemma, ...prev]);
    setDilemmaText('');
    setSelectedEmotion(null);
    setSelectedId(newDilemma.id);
    if (!userEmotionRoom) {
      setUserEmotionRoom(selectedEmotion);
      localStorage.setItem('shadowtalk-emotion-room', selectedEmotion);
    }
  }

  function handleSelectDilemma(id) {
    setSelectedId(id);
    setReplyText('');
  }

  function handleAddReply(e) {
    e.preventDefault();
    if (!selectedDilemma) return;
    if (userEmotionRoom !== selectedDilemma.emotion) {
      alert('You can only reply to dilemmas in your current emotion room. Switch to the matching emotion room first.');
      return;
    }
    const trimmed = replyText.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_REPLY_LENGTH) return;

    const reply = {
      id: Date.now().toString(),
      text: trimmed,
      authorId: anonId,
      tokens: 0
    };

    setDilemmas((prev) =>
      prev.map((d) =>
        d.id === selectedDilemma.id
          ? {
              ...d,
              replies: [...d.replies, reply]
            }
          : d
      )
    );
    setReplyText('');
  }

  function handleJoinEmotionRoom(emotionId) {
    setUserEmotionRoom(emotionId);
    localStorage.setItem('shadowtalk-emotion-room', emotionId);
    setSelectedId(null);
  }

  function handleLeaveRoom() {
    setUserEmotionRoom(null);
    localStorage.removeItem('shadowtalk-emotion-room');
    setSelectedId(null);
  }

  function handleGiveToken(dilemmaId, replyId) {
    setDilemmas((prev) =>
      prev.map((d) => {
        if (d.id !== dilemmaId) return d;
        const updatedReplies = d.replies.map((r) =>
          r.id === replyId ? { ...r, tokens: r.tokens + 1 } : r
        );
        const totalTokens = updatedReplies.reduce(
          (sum, r) => sum + r.tokens,
          0
        );
        return {
          ...d,
          replies: updatedReplies,
          totalTokens
        };
      })
    );
  }

  function handleNewPrompt() {
    setPrompt(getRandomPrompt());
  }

  function handleToggleShadowMode() {
    setShadowMode((prev) => !prev);
  }

  function handlePanic() {
    setPanicHidden(true);
    setTimeout(() => setPanicHidden(false), 4000);
  }

  return (
    <div className={`app-root ${shadowMode ? 'app-root--shadow' : ''}`}>
      <header className="app-header">
        <div>
          <h1>ShadowTalk</h1>
          <p className="subtitle">
            Speak freely. Stay anonymous. Share dilemmas with empathy.
          </p>
        </div>
        <div className="header-controls">
          <div className="anon-pill">
            Your anonymous ID: <span>{anonId}</span>
          </div>
          {userEmotionRoom && (
            <div className="emotion-room-indicator">
              <span className="emotion-room-label">In room:</span>
              <span className="emotion-room-badge">
                {EMOTIONS.find((e) => e.id === userEmotionRoom)?.emoji}{' '}
                {EMOTIONS.find((e) => e.id === userEmotionRoom)?.label}
              </span>
              <button
                type="button"
                className="btn btn-small btn-ghost"
                onClick={handleLeaveRoom}
                title="Leave emotion room"
              >
                Leave
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleToggleShadowMode}
          >
            {shadowMode ? 'Lighten Shadows' : 'Deepen Shadows'}
          </button>
          <button
            type="button"
            className="btn btn-panic"
            onClick={handlePanic}
            title="Quickly hide the screen"
          >
            Panic Hide
          </button>
        </div>
      </header>

      <main className={`layout ${panicHidden ? 'layout--hidden' : ''}`}>
        <section className="column column-main">
          <div className="card">
            <h2>Share your dilemma</h2>
            <p className="helper-text">
              Post anonymously. Select your emotion to join an emotion-matched room where others feeling the same way can reply.
            </p>
            <form onSubmit={handlePostDilemma} className="form">
              <label className="field-label">
                Select your emotion
                <div className="emotion-selector">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.id}
                      type="button"
                      className={`emotion-btn ${
                        selectedEmotion === emotion.id ? 'emotion-btn--active' : ''
                      }`}
                      onClick={() => setSelectedEmotion(emotion.id)}
                    >
                      <span className="emotion-emoji">{emotion.emoji}</span>
                      <span className="emotion-label">{emotion.label}</span>
                    </button>
                  ))}
                </div>
              </label>
              <label className="field-label">
                Your dilemma
                <textarea
                  value={dilemmaText}
                  onChange={(e) => setDilemmaText(e.target.value)}
                  placeholder={prompt}
                  rows={4}
                  className="input-textarea"
                />
              </label>
              <div className="form-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleNewPrompt}
                >
                  New prompt
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedEmotion}
                >
                  Post anonymously
                </button>
              </div>
            </form>
          </div>

          <div className="card card-replies">
            <div className="card-header">
              <h2>Replies</h2>
              {selectedDilemma && (
                <span className="tag">
                  Empathy tokens: {selectedDilemma.totalTokens}
                </span>
              )}
            </div>

            {!selectedDilemma && (
              <p className="empty-text">
                Select a dilemma from the sidebar to view and reply.
              </p>
            )}

            {selectedDilemma && (
              <>
                <div className="selected-dilemma">
                  <div className="selected-dilemma-header">
                    <h3>Current dilemma</h3>
                    <span className="emotion-badge">
                      {EMOTIONS.find((e) => e.id === selectedDilemma.emotion)?.emoji}{' '}
                      {EMOTIONS.find((e) => e.id === selectedDilemma.emotion)?.label}
                    </span>
                  </div>
                  <p>{selectedDilemma.text}</p>
                  {userEmotionRoom !== selectedDilemma.emotion && (
                    <div className="emotion-mismatch-warning">
                      ⚠️ You're in a different emotion room. Switch to{' '}
                      <strong>
                        {EMOTIONS.find((e) => e.id === selectedDilemma.emotion)?.label}
                      </strong>{' '}
                      room to reply.
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddReply} className="form reply-form">
                  <label className="field-label">
                    Your short reply
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      className="input-textarea"
                      maxLength={MAX_REPLY_LENGTH}
                      placeholder="Reply in 200 characters or less..."
                    />
                  </label>
                  <div className="reply-footer">
                    <span className="char-count">
                      {replyText.length}/{MAX_REPLY_LENGTH}
                    </span>
                    <button type="submit" className="btn btn-primary">
                      Send reply
                    </button>
                  </div>
                </form>

                <ul className="reply-list">
                  {selectedDilemma.replies.length === 0 && (
                    <li className="empty-text">
                      No replies yet. Be the first to respond with empathy.
                    </li>
                  )}
                  {selectedDilemma.replies.map((reply) => (
                    <li key={reply.id} className="reply-item">
                      <p>{reply.text}</p>
                      <div className="reply-meta">
                        <span className="reply-id">
                          From: {reply.authorId}
                        </span>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() =>
                            handleGiveToken(selectedDilemma.id, reply.id)
                          }
                        >
                          Empathy +1 ({reply.tokens})
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <aside className="column column-side">
          {!userEmotionRoom && (
            <div className="card card-emotion-rooms">
              <h2>Join an emotion room</h2>
              <p className="helper-text">
                Select an emotion to see dilemmas from others feeling the same way. You can only reply when you're in the matching emotion room.
              </p>
              <div className="emotion-rooms-grid">
                {EMOTIONS.map((emotion) => {
                  const roomCount = dilemmas.filter((d) => d.emotion === emotion.id).length;
                  return (
                    <button
                      key={emotion.id}
                      type="button"
                      className="emotion-room-card"
                      onClick={() => handleJoinEmotionRoom(emotion.id)}
                    >
                      <span className="emotion-room-emoji">{emotion.emoji}</span>
                      <span className="emotion-room-name">{emotion.label}</span>
                      <span className="emotion-room-count">
                        {roomCount} {roomCount === 1 ? 'dilemma' : 'dilemmas'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <h2>
              {userEmotionRoom
                ? `${EMOTIONS.find((e) => e.id === userEmotionRoom)?.label} room dilemmas`
                : 'Recent dilemmas'}
            </h2>
            {filteredDilemmas.length === 0 && (
              <p className="empty-text">
                {userEmotionRoom
                  ? `No dilemmas in ${EMOTIONS.find((e) => e.id === userEmotionRoom)?.label} room yet. Be the first to post.`
                  : 'Join an emotion room to see dilemmas.'}
              </p>
            )}
            <ul className="dilemma-list">
              {filteredDilemmas.map((d) => (
                <li
                  key={d.id}
                  className={`dilemma-item ${
                    d.id === selectedId ? 'dilemma-item--active' : ''
                  }`}
                  onClick={() => handleSelectDilemma(d.id)}
                >
                  <div className="dilemma-header-row">
                    <span className="dilemma-emotion-tag">
                      {EMOTIONS.find((e) => e.id === d.emotion)?.emoji}
                    </span>
                    <p className="dilemma-text">
                      {d.text.length > 80
                        ? d.text.slice(0, 80) + '...'
                        : d.text}
                    </p>
                  </div>
                  <div className="dilemma-meta">
                    <span className="mini-id">{d.authorId}</span>
                    <span className="mini-tokens">
                      Tokens: {d.totalTokens}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Trending dilemmas</h2>
            {trendingDilemmas.length === 0 && (
              <p className="empty-text">
                Trending analytics will appear once dilemmas receive tokens.
              </p>
            )}
            <ul className="dilemma-list">
              {trendingDilemmas.map((d) => (
                <li
                  key={d.id}
                  className="dilemma-item"
                  onClick={() => handleSelectDilemma(d.id)}
                >
                  <p className="dilemma-text">
                    {d.text.length > 60
                      ? d.text.slice(0, 60) + '...'
                      : d.text}
                  </p>
                  <div className="dilemma-meta">
                    <span className="mini-tokens">
                      Empathy tokens: {d.totalTokens}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card card-info">
            <h2>About ShadowTalk</h2>
            <p>
              ShadowTalk is an empathy-driven micro-advice platform. Share your
              real-world dilemmas anonymously and receive short, focused
              responses from others.
            </p>
            <ul className="info-list">
              <li>Anonymous posting with unique IDs</li>
              <li>Emotion-matched reply rooms for empathy</li>
              <li>Short replies limited to 200 characters</li>
              <li>Empathy tokens to highlight helpful advice</li>
              <li>Simple analytics for trending dilemmas</li>
              <li>Random prompts to spark reflection</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <span>Built with React · Dark “shadow” theme · Semester 3 level</span>
      </footer>
    </div>
  );
}

export default App;


