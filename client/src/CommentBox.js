// CommentBox.js
import React, { Component } from 'react';
import 'whatwg-fetch';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import './CommentBox.css';

class CommentBox extends Component {
  constructor() {
    super();
    this.state = {
      data: [],
      error: null,
      author: '',
      comment: '',
      updateId: null,
      toxicity: ''
    };
    this.pollInterval = null;
  }

  componentDidMount() {
    this.loadCommentsFromServer();
    const { author, text, updateId } = this.state;
    if (!author && !text) {
      this.state.toxicity=0;
    }
    if (!this.pollInterval) {
      this.pollInterval = setInterval(this.loadCommentsFromServer, 2000);
    }
  }

  componentWillUnmount() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
  }

   updateToxicity(words) {
    fetch('/api/toxicity/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({text: words })
    })
    .then(res => res.json())
    .then((res) => {
      if (res.success) {
        this.state.toxicity = res.value;
        console.log(res.value);
      } else {
        console.log("There was an issue getting the toxicity");
      }
    });
  }

  onChangeText = (e='') => {
    const newState = { ...this.state };
    newState[e.target.name] = e.target.value;
    let comment = e.target.value;
    if(comment.length == 0){
      newState.toxicity=0;
      console.log(comment);
    }else{
      this.updateToxicity(comment);
    }
    this.setState(newState);
  }

  onChangeAuthor = (e='') => {
    const newState = { ...this.state };
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  }

  onUpdateComment = (id) => {
    const oldComment = this.state.data.find(c => c._id === id);
    if (!oldComment) return;
    this.setState({ author: oldComment.author, text: oldComment.text, toxicity: oldComment.toxicity, updateId: id });
  }

  onDeleteComment = (id) => {
    const i = this.state.data.findIndex(c => c._id === id);
    const data = [
      ...this.state.data.slice(0, i),
      ...this.state.data.slice(i + 1),
    ];
    this.setState({ data });
    fetch(`api/comments/${id}`, { method: 'DELETE' })
      .then(res => res.json()).then((res) => {
        if (!res.success) this.setState({ error: res.error });
      });
  }

  submitComment = (e) => {
    e.preventDefault();
    const { author, text, updateId } = this.state;
    if (!author || !text) return window.confirm("Oops! You must've forgotten your name and comment!");
    if (this.state.toxicity >= 0.6) return window.confirm("Please revise your comment to decrease toxicity. We want to keep conversations productive and toxic-free. Happy PureChatting!");
    if (updateId) {
      this.submitUpdatedComment();
    } else {
      this.submitNewComment();
    }
    this.state.toxicity=0;
  }

  submitNewComment = () => {
    const { author, text, toxicity } = this.state;
    const data = [...this.state.data, { author, text, toxicity, _id: Date.now().toString() }];
    this.setState({ data });
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, toxicity}),
    }).then(res => res.json()).then((res) => {
      if (!res.success) this.setState({ error: res.error.message || res.error });
      else this.setState({ author: '', text: '', error: null });
    });
  }

  submitUpdatedComment = () => {
    const { author, text, toxicity, updateId } = this.state;
    fetch(`/api/comments/${updateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, toxicity }),
    }).then(res => res.json()).then((res) => {
      if (!res.success) this.setState({ error: res.error.message || res.error });
      else this.setState({ author: '', text: '', updateId: null });
    });
  }

  loadCommentsFromServer = () => {
    // fetch returns a promise. If you are not familiar with promises, see
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    fetch('/api/comments/')
      .then(data => data.json())
      .then((res) => {
        if (!res.success) this.setState({ error: res.error });
        else this.setState({ data: res.data });
      });
  }

  render() {
    return (
      <div className="container">
        <div className="comments">
          <h2>Thoughts?</h2>
          <CommentList
            data={this.state.data}
            handleDeleteComment={this.onDeleteComment}
            handleUpdateComment={this.onUpdateComment}
          />
        </div>
        <div className="form">
          <CommentForm
            author={this.state.author}
            text={this.state.text}
            handleChangeAuthor={this.onChangeAuthor}
            handleChangeText={this.onChangeText}
            submitComment={this.submitComment}
          />
          <span className="toxicity toxicityWords">What's your toxicity? {this.state.toxicity}</span>
        </div>
        {this.state.error && <p>{this.state.error}</p>}
      </div>
    );
  }
}

export default CommentBox;
