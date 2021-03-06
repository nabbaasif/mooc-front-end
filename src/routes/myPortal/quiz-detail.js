import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import {
  Row,
  Nav,
  NavItem,
  TabContent,
  TabPane,
  Button,
  Card,
  CardBody
} from "reactstrap";
import { Link, withRouter } from "react-router-dom";
import classnames from "classnames";
import { mapOrder } from "../../util/Utils";
import { Colxx } from "../../components/CustomBootstrap";
import QuestionBuilder from "../../containers/Quiz/QuestionBuilder";
import ThumbnailImage from "../../components/cards/ThumbnailImage";
import {
  getQuizDetail,
  deleteQuizQuestion,
  saveSurvey,
  findSolvedQuiz
} from "../../redux/actions";
import QuizDetailCard from "../../containers/Quiz/DetailCard";
import axios from "axios";
import { URL, config } from "../../constants/defaultValues";
import { socket } from "../../containers/TopNav";
import queryString from "query-string";

let hidden = null;
let visibilityChange = null;
if (typeof document.hidden !== "undefined") {
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

class SurveyDetailApp extends Component {
  constructor(props) {
    super(props);
    this.toggleTab = this.toggleTab.bind(this);
    this.state = {
      activeFirstTab: "1",
      dropdownSplitOpen: false,
      actions: "",
      socket: null,
      firstTime: true,
      totalQuestions: [],
      myQuestions: [],
      runTimes: 2,
      quiz: "",
      course: "",
      isSubmitted: false
    };
  }

  componentDidUpdate() {
    if (this.props.quizzes.quiz && this.state.firstTime) {
      this.setState({
        firstTime: false,
        totalQuestions: this.props.quizzes.quiz.questions
      });
    }
  }
  async componentDidMount() {
    document.addEventListener(
      visibilityChange,
      this.handleVisibilityChange,
      false
    );
    const values = queryString.parse(this.props.location.search);

    if (values.id) {
      this.props.getQuizDetail(values.id);
      const quiz = values.id;
      const body = JSON.stringify({ quiz });
      await axios.post(URL + "api/quiz/isSubmitted", body, config).then(res => {
        this.setState({ isSubmitted: res.data });
      });
    }
    if (values.id && values.cid) {
      this.setState({ course: values.cid, quiz: values.id });
      this.props.findSolvedQuiz(values.cid, values.id);
    }
    if (!this.state.socket) {
      this.state.socket = socket;
    }
  }
  handleVisibilityChange = () => {
    if (document[hidden]) {
      if (
        !this.state.isSubmitted &&
        this.props.user &&
        this.props.user.roll.toLowerCase() === "student"
      ) {
        this.studentSubmitQuiz();
        window.location.reload();
      }
    } else {
      this.setState({ actions: "show" });
    }
  };
  handleWindowClose() {
    if (
      !this.state.isSubmitted &&
      this.props.user &&
      this.props.user.roll.toLowerCase() === "student"
    ) {
      this.studentSubmitQuiz();
      window.location.reload();
    }
  }

  componentWillUnmount() {
    if (
      !this.state.isSubmitted &&
      this.props.user &&
      this.props.user.roll.toLowerCase() === "student"
    ) {
      document.removeEventListener(
        visibilityChange,
        this.handleVisibilityChange
      );
      window.removeEventListener("onbeforeunload", this.handleWindowClose);
    }
  }

  toggleTab(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeFirstTab: tab
      });
    }
  }
  SolvedAnswers(id, qestion, type, answers, myans) {
    this.setState(prevState => ({
      myQuestions: [
        ...prevState.myQuestions,
        {
          id: id,
          question: qestion,
          answerType: type,
          answers: answers,
          myAnswer: myans
        }
      ]
    }));
    this.setState({ runTimes: 1 });
  }

  addQuestion(qestion, type, answers) {
    const { quiz } = this.props.quizzes;
    var nextId = quiz.questions.length;
    const newQuizItem = Object.assign({}, quiz);
    newQuizItem.questions.push({
      id: nextId,
      question: qestion,
      answerType: type,
      answers: answers
    });
    this.props.saveSurvey(newQuizItem);
  }

  handleSortChange(order, sortable, evt) {
    const { quiz } = this.props.quizzes;
    var ordered_array = mapOrder(quiz.questions, order, "id");
    this.props.saveSurvey(ordered_array);
  }
  find(array, title) {
    return array.find(element => {
      return element.title === title;
    });
  }
  async studentSubmitQuiz() {
    const items = this.state.myQuestions;

    let questions = [];
    for (let i = items.length - 1; i > 0; i--) {
      let bool = questions.find(element => element.id === items[i].id);
      if (!bool) {
        questions.push(items[i]);
      }
    }
    const values = queryString.parse(this.props.location.search);
    const quiz = values.id;
    const course = values.cid;
    const body = JSON.stringify({ quiz, course, questions });
    const res = await axios.post(URL + "api/quiz/studentsubmit", body, config);
    window.location.reload();
  }

  async submitQuiz() {
    const items = this.props.quizzes.quiz.questions;
    let questions = [];
    for (let i = items.length - 1; i > 0; i--) {
      let bool = questions.find(element => element.id === items[i].id);
      if (!bool) {
        questions.push(items[i]);
      }
    }
    const id = this.state.quiz;
    let body = JSON.stringify({ questions, id });
    const res = await axios.post(URL + "api/quiz/uploadquiz", body, config);

    const quiz = res.data._id;
    const course = res.data.course._id;
    const user = this.props.user._id;
    const message = `Quiz for ${res.data.course.name} has been added`;
    body = JSON.stringify({ user, course, quiz, message });
    this.state.socket.emit("new_notification", {
      body: body,
      message: message,
      user: user,
      course: course,
      quiz: quiz
    });
    window.location.reload();
  }

  deleteQuestion(id) {
    this.props.deleteQuizQuestion(id, this.props.quizzes.quiz);
  }

  render() {
    const { quiz, loading } = this.props.quizzes;
    let roll;
    if (this.props.user) roll = this.props.user.roll.toLowerCase();

    return (
      <Fragment>
        <Row className="app-row survey-app">
          <Colxx xxs="12">
            <h1>
              <span className="align-middle d-inline-block pt-1">
                {this.props.quizzes.quiz && this.props.quizzes.quiz.course.name}
              </span>
            </h1>

            {roll === "teacher" && (
              <div className="float-sm-right mb-2">
                <Button
                  outline
                  className="top-right-button top-right-button-single flex-grow-1"
                  size="lg"
                  onClick={() => this.submitQuiz()}
                >
                  UPDATE
                </Button>
              </div>
            )}
            {!this.state.isSubmitted && roll === "student" && (
              <div className="float-sm-right mb-2">
                <Button
                  outline
                  className="top-right-button top-right-button-single flex-grow-1"
                  size="lg"
                  onClick={() => this.studentSubmitQuiz()}
                >
                  SUBMIT
                </Button>
              </div>
            )}
            {loading ? (
              <Fragment>
                {roll === "teacher" && (
                  <Nav tabs className="separator-tabs ml-0 mb-5">
                    <NavItem>
                      <Link
                        className={classnames({
                          active: this.state.activeFirstTab === "1",
                          "nav-link": true
                        })}
                        onClick={() => {
                          this.toggleTab("1");
                        }}
                        to={`/app/myportal/openquiz/?id=${this.state.quiz}&cid=${this.state.course}`}
                      >
                        DETAILS
                      </Link>
                    </NavItem>
                    <NavItem>
                      <Link
                        className={classnames({
                          active: this.state.activeFirstTab === "2",
                          "nav-link": true
                        })}
                        onClick={() => {
                          this.toggleTab("2");
                        }}
                        to={`/app/myportal/openquiz/?id=${this.state.quiz}&cid=${this.state.course}`}
                      >
                        RESULTS
                      </Link>
                    </NavItem>
                  </Nav>
                )}

                <TabContent activeTab={this.state.activeFirstTab}>
                  <TabPane tabId="1">
                    <Row>
                      {this.props.user && (
                        <QuizDetailCard
                          deleteClick={id => {
                            this.studentSubmitQuiz(id);
                          }}
                          isSubmitted={!this.state.isSubmitted}
                          user={this.props.user}
                          quiz={quiz}
                        />
                      )}

                      <Colxx xxs="12" lg="8">
                        {roll === "teacher" && (
                          <ul className="list-unstyled mb-4">
                            {quiz.questions.map((item, index) => {
                              return (
                                <li data-id={item.id} key={item.id}>
                                  <QuestionBuilder
                                    order={index}
                                    {...item}
                                    runTimes={1}
                                    roll="teacher"
                                    answers={item.answers}
                                    expanded={!item.question && true}
                                    deleteClick={id => {
                                      this.deleteQuestion(id);
                                    }}
                                    submitQuestion={(
                                      id,
                                      qestion,
                                      type,
                                      answers
                                    ) => {
                                      this.addQuestion(qestion, type, answers);
                                    }}
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {roll === "student" && (
                          <ul className="list-unstyled mb-4">
                            {this.state.totalQuestions.map((item, index) => {
                              return (
                                <li data-id={item.id} key={item.id}>
                                  <QuestionBuilder
                                    order={index}
                                    {...item}
                                    answers={item.answers}
                                    expanded={!item.question && true}
                                    roll="student"
                                    submitQuestion={(
                                      id,
                                      qestion,
                                      type,
                                      answers,
                                      myans
                                    ) => {
                                      this.SolvedAnswers(
                                        id,
                                        qestion,
                                        type,
                                        answers,
                                        myans
                                      );
                                    }}
                                    runTimes={this.state.runTimes}
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {quiz &&
                          quiz.questions.length === 0 &&
                          roll === "teacher" && (
                            <div className="text-center">
                              <Button
                                outline
                                color="primary"
                                className="mt-3"
                                onClick={() => this.addQuestion()}
                              >
                                <i className="simple-icon-plus btn-group-icon" />{" "}
                                Add Question
                              </Button>
                            </div>
                          )}
                      </Colxx>
                    </Row>
                  </TabPane>
                  {roll === "teacher" &&
                    this.props.allSurveyItems &&
                    this.props.allSurveyItems.map((item, index) => {
                      return (
                        <TabPane tabId="2">
                          <Colxx xxs="12">
                            <Card className="card d-flex flex-row mb-3">
                              <div className="d-flex flex-grow-1 min-width-zero">
                                <CardBody className="align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                                  <Link
                                    to={`/app/myportal/viewquiz/${item._id}`}
                                    target="_blank"
                                    className="list-item-heading mb-0 truncate w-40 w-xs-100  mb-1 mt-1"
                                  >
                                    <ThumbnailImage
                                      rounded
                                      small
                                      src={
                                        "../../assets/images/" +
                                        item.user.avatar
                                      }
                                      alt="profile"
                                      className="m-4"
                                    />
                                    <i className="" />
                                    <span className="align-middle d-inline-block">
                                      {item.user.name}
                                    </span>
                                  </Link>

                                  <Button
                                    outline
                                    color="primary"
                                    className="mt-3"
                                  >
                                    <Link
                                      to={`/app/myportal/viewquiz/${item._id}`}
                                      target="_blank"
                                    >
                                      Open Quiz
                                    </Link>
                                  </Button>
                                </CardBody>
                              </div>
                            </Card>
                          </Colxx>
                        </TabPane>
                      );
                    })}
                </TabContent>
              </Fragment>
            ) : (
              <div className="loading" />
            )}
          </Colxx>
        </Row>
      </Fragment>
    );
  }
}

const mapStateToProps = ({ quizzes, quizList, auth }) => {
  const { user } = auth;
  const { allSurveyItems } = quizList;
  return {
    allSurveyItems,
    quizzes,
    user
  };
};
export default withRouter(
  connect(mapStateToProps, {
    getQuizDetail,
    findSolvedQuiz,
    deleteQuizQuestion,
    saveSurvey
  })(SurveyDetailApp)
);
