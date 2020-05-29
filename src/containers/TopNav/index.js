import React, { Component } from "react";
import { injectIntl } from "react-intl";
import IntlMessages from "../../util/IntlMessages";
import {
  UncontrolledDropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu,
  Input,
  ModalBody,
  Modal,
  ModalFooter,
  ModalHeader,
  Card,
  CardBody,
  Row
} from "reactstrap";
import io from "socket.io-client";
import { Colxx } from "../../components/CustomBootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import { NavLink, Link } from "react-router-dom";
import { connect } from "react-redux";
import {
  setContainerClassnames,
  clickOnMobileMenu,
  logout,
  changeLocale,
  searchSelection,
  searchKeyword,
  GetSubscription,
  getmyCourse,
  getNotifications
} from "../../redux/actions";
import axios from "axios";
import { URL, config } from "../../constants/defaultValues";
import moment from "moment";
import {
  menuHiddenBreakpoint,
  localeOptions,
  searchBy
} from "../../constants/defaultValues";
export const socket = io(":5000");

class TopNav extends Component {
  constructor(props) {
    super(props);
    this.menuButtonClick = this.menuButtonClick.bind(this);
    this.mobileMenuButtonClick = this.mobileMenuButtonClick.bind(this);
    this.search = this.search.bind(this);
    this.handleChangeLocale = this.handleChangeLocale.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.searchBy = this.handleDocumentClickSearch = this.handleDocumentClickSearch.bind(
      this
    );
    this.addEventsSearch = this.addEventsSearch.bind(this);
    this.removeEventsSearch = this.removeEventsSearch.bind(this);
    this.state = {
      isInFullScreen: false,
      searchKeyword: "",
      searchBy: "",
      socket: null,
      notifications: [],
      firstTime: true,
      listCourse: [],
      loadNotification: true,
      getUnSeen: [],
      modalOpen: false,
      today: null
    };
  }
  async makecoursesList() {
    let size;
    if (this.props.user.roll === "teacher") {
      size = this.props.myCourses ? this.props.myCourses.length : 0;
      for (let i = 0; i < size; i++) {
        this.state.listCourse[i] = this.props.myCourses[i]._id;
      }
    } else {
      size = this.props.courses ? this.props.courses.length : 0;
      for (let i = 0; i < size; i++) {
        this.state.listCourse[i] = this.props.courses[i]._id;
      }
      const course = this.state.listCourse;
      const body = JSON.stringify({ course });
      await axios
        .post(URL + "api/assignment/todayassignments", body, config)
        .then(res => this.setState({ today: res.data }));
    }
    this.props.getNotifications(this.state.listCourse, this.props.user._id);
  }
  componentDidMount() {
    if (!this.state.socket) {
      this.state.socket = socket;
    }

    this.props.GetSubscription();
    this.props.getmyCourse();
  }
  componentDidUpdate(prevState, prevProps) {
    if (this.props.notify.length > 0 && this.state.loadNotification) {
      this.setState({
        notifications: this.props.notify,
        loadNotification: false
      });
    }
    if (this.props.user && this.state.listCourse.length == 0) {
      this.makecoursesList();
    }
    // if (this.state.firstTime) {
    //   this.setState({
    //     firstTime: false
    //   });
    //   let mess;
    //   this.state.socket.on("show_notification", mess => {
    //     this.setState(prevState => ({
    //       notifications: [mess, ...prevState.notifications]
    //     }));
    //   });

    // }
    if (this.state.notifications !== prevState.notifications) {
      let mess;
      this.state.socket.on("show_notification", mess => {
        if (mess !== this.state.notifications[0])
          this.setState(prevState => ({
            notifications: [mess, ...prevState.notifications]
          }));
      });
    }
  }
  handleSearchChange = selection => {
    this.props.searchSelection(selection);
  };
  handleChangeLocale = locale => {
    this.props.changeLocale(locale);
  };
  isInFullScreen = () => {
    return (
      (document.fullscreenElement && document.fullscreenElement !== null) ||
      (document.webkitFullscreenElement &&
        document.webkitFullscreenElement !== null) ||
      (document.mozFullScreenElement &&
        document.mozFullScreenElement !== null) ||
      (document.msFullscreenElement && document.msFullscreenElement !== null)
    );
  };
  handleSearchIconClick = e => {
    if (window.innerWidth < menuHiddenBreakpoint) {
      let elem = e.target;
      if (!e.target.classList.contains("search")) {
        if (e.target.parentElement.classList.contains("search")) {
          elem = e.target.parentElement;
        } else if (
          e.target.parentElement.parentElement.classList.contains("search")
        ) {
          elem = e.target.parentElement.parentElement;
        }
      }

      if (elem.classList.contains("mobile-view")) {
        this.search();
        elem.classList.remove("mobile-view");
        this.removeEventsSearch();
      } else {
        elem.classList.add("mobile-view");
        this.addEventsSearch();
      }
    } else {
      this.search();
    }
  };
  addEventsSearch() {
    document.addEventListener("click", this.handleDocumentClickSearch, true);
  }
  removeEventsSearch() {
    document.removeEventListener("click", this.handleDocumentClickSearch, true);
  }

  handleDocumentClickSearch(e) {
    let isSearchClick = false;
    if (
      e.target &&
      e.target.classList &&
      (e.target.classList.contains("navbar") ||
        e.target.classList.contains("simple-icon-magnifier"))
    ) {
      isSearchClick = true;
      if (e.target.classList.contains("simple-icon-magnifier")) {
        this.search();
      }
    } else if (
      e.target.parentElement &&
      e.target.parentElement.classList &&
      e.target.parentElement.classList.contains("search")
    ) {
      isSearchClick = true;
    }

    if (!isSearchClick) {
      const input = document.querySelector(".mobile-view");
      if (input && input.classList) input.classList.remove("mobile-view");
      this.removeEventsSearch();
      this.setState({
        searchKeyword: ""
      });
    }
  }
  handleSearchInputChange(e) {
    this.setState({
      searchKeyword: e.target.value
    });
  }
  handleSearchInputKeyPress(e) {
    if (e.key === "Enter") {
      this.props.history.push(
        "/app/search/?search=" + this.state.searchKeyword + "&r=" + true
      );
    }
  }
  dropDownSearch() {}
  search() {
    this.setState({
      searchKeyword: ""
    });
  }

  toggleFullScreen = () => {
    const isInFullScreen = this.isInFullScreen();

    var docElm = document.documentElement;
    if (!isInFullScreen) {
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
      } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    this.setState({
      isInFullScreen: !isInFullScreen
    });
  };

  handleLogout = () => {
    this.props.logout();
  };
  switchAccount = e => {
    e.preventDefault();
    axios.get(URL + "api/auth/welcome", {}, config);
    window.location.reload();
  };

  menuButtonClick(e, menuClickCount, containerClassnames) {
    e.preventDefault();

    setTimeout(() => {
      var event = document.createEvent("HTMLEvents");
      event.initEvent("resize", false, false);
      window.dispatchEvent(event);
    }, 350);
    this.props.setContainerClassnames(++menuClickCount, containerClassnames);
  }
  mobileMenuButtonClick(e, containerClassnames) {
    e.preventDefault();
    this.props.clickOnMobileMenu(containerClassnames);
  }

  setNotifications(message, date) {
    return (
      <div>
        <p className="font-weight-medium mb-1">{message}</p>
        <p className="text-muted mb-0 text-small">
          {moment(date).format("ddd HH:mm a")}
        </p>
      </div>
    );
  }
  toggleModal = () => {
    this.setState({
      modalOpen: !this.state.modalOpen
    });
  };
  render() {
    const { containerClassnames, menuClickCount, user } = this.props;
    const { messages } = this.props.intl;
    if (user) {
      let profileImage = require("../../assets/images/" + user.avatar);

      return (
        <nav className="navbar fixed-top">
          <NavLink
            to="#"
            className="menu-button d-none d-md-block"
            onClick={e =>
              this.menuButtonClick(e, menuClickCount, containerClassnames)
            }
          >
            <svg
              className="main"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 9 17"
            >
              <rect x="0.48" y="0.5" width="7" height="1" />
              <rect x="0.48" y="7.5" width="7" height="1" />
              <rect x="0.48" y="15.5" width="7" height="1" />
            </svg>
            <svg
              className="sub"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 17"
            >
              <rect x="1.56" y="0.5" width="16" height="1" />
              <rect x="1.56" y="7.5" width="16" height="1" />
              <rect x="1.56" y="15.5" width="16" height="1" />
            </svg>
          </NavLink>
          <NavLink
            to="#"
            className="menu-button-mobile d-xs-block d-sm-block d-md-none"
            onClick={e => this.mobileMenuButtonClick(e, containerClassnames)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 17">
              <rect x="0.5" y="0.5" width="25" height="1" />
              <rect x="0.5" y="7.5" width="25" height="1" />
              <rect x="0.5" y="15.5" width="25" height="1" />
            </svg>
          </NavLink>

          <div className="search" data-search-path="/app/layouts/search">
            <Input
              name="searchKeyword"
              id="searchKeyword"
              placeholder={messages["menu.search"]}
              value={this.state.searchKeyword}
              onChange={e => this.handleSearchInputChange(e)}
              onKeyPress={e => this.handleSearchInputKeyPress(e)}
            />
            <span
              className="search-icon"
              onClick={e => this.handleSearchIconClick(e)}
            >
              <i className="simple-icon-magnifier" />
            </span>
          </div>

          <div className="d-inline-block">
            <UncontrolledDropdown className="ml-2">
              <DropdownToggle
                caret
                color="light"
                size="sm"
                className="language-button"
              >
                <span className="name">
                  {this.props.searchBy.toUpperCase()}
                </span>
              </DropdownToggle>
              <DropdownMenu className="mt-3" right>
                {searchBy.map(item => {
                  return (
                    <DropdownItem
                      onClick={() => this.handleSearchChange(item.id)}
                      key={item.id}
                    >
                      {item.id}
                    </DropdownItem>
                  );
                })}
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>
          <div className="d-inline-block">
            <UncontrolledDropdown className="ml-2">
              <DropdownToggle
                caret
                color="light"
                size="sm"
                className="language-button"
              >
                <span className="name">{this.props.locale.toUpperCase()}</span>
              </DropdownToggle>
              <DropdownMenu className="mt-3" right>
                {localeOptions.map(l => {
                  return (
                    <DropdownItem
                      onClick={() => this.handleChangeLocale(l.id)}
                      key={l.id}
                    >
                      {l.name}
                    </DropdownItem>
                  );
                })}
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>

          <a className="navbar-logo" href="/">
            <span className="logo d-none d-xs-block" />
            <span className="logo-mobile d-block d-xs-none" />
          </a>

          <div className="ml-auto">
            <div className="header-icons d-inline-block align-middle">
              <div className="position-relative d-inline-block">
                <UncontrolledDropdown className="dropdown-menu-right">
                  <DropdownToggle
                    className="header-icon notificationButton"
                    color="empty"
                    //onClick={this.setNotifications}
                  >
                    <i className="simple-icon-bell" />
                    {/* <span className="count">3</span> */}
                  </DropdownToggle>
                  <DropdownMenu
                    className="position-absolute mt-3 scroll"
                    right
                    id="notificationDropdown"
                  >
                    <Link to="/app/notification" className="float-left">
                      View All
                    </Link>
                    <div className="separator"></div>

                    <PerfectScrollbar
                      options={{
                        suppressScrollX: true,
                        wheelPropagation: false
                      }}
                    >
                      {this.state.notifications.map((n, index) => {
                        let match = true;
                        let itself = false;
                        if (n.course) {
                          match = this.state.listCourse.find(
                            u => u === n.course
                          );
                        }
                        if (n.user) {
                          itself = n.user === this.props.user._id;
                        }

                        if (match && !itself) {
                          return (
                            <div
                              key={index}
                              className="d-flex flex-row mb-3 pb-3 border-bottom"
                            >
                              <div className="pl-3 pr-2">
                                {n.quiz && (
                                  <a href="/app/myportal/quiz">
                                    {this.setNotifications(n.message, n.date)}
                                  </a>
                                )}
                                {n.anouncements && (
                                  <a href="/app/myportal/anouncements">
                                    {this.setNotifications(n.message, n.date)}
                                  </a>
                                )}
                                {n.assignment && (
                                  <a href="/app/myportal/assignment">
                                    {this.setNotifications(n.message, n.date)}
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </PerfectScrollbar>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </div>

              <button
                className="header-icon btn btn-empty d-none d-sm-inline-block"
                type="button"
                id="fullScreenButton"
                onClick={this.toggleFullScreen}
              >
                {this.state.isInFullScreen ? (
                  <i className="simple-icon-size-actual d-block" />
                ) : (
                  <i className="simple-icon-size-fullscreen d-block" />
                )}
              </button>
            </div>
            <div className="user d-inline-block">
              <UncontrolledDropdown className="dropdown-menu-right">
                <DropdownToggle className="p-0" color="empty">
                  <span className="name mr-1">
                    {user && user.roll.toUpperCase()}
                  </span>
                  <span>
                    <img alt="Profile" src={profileImage} />
                  </span>
                </DropdownToggle>
                <DropdownMenu className="mt-3" right>
                  {user.roll.toLowerCase() !== "admin" && (
                    <DropdownItem onClick={e => this.switchAccount(e)}>
                      Switch
                    </DropdownItem>
                  )}

                  <DropdownItem>Support</DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem onClick={() => this.handleLogout()}>
                    Sign out
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>
          </div>
          <NavLink
            to="#"
            className="menu-button d-none d-md-block"
            onClick={this.toggleModal}
          >
            <svg
              className="main"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 9 17"
            >
              <rect x="0.48" y="0.5" width="7" height="1" />
              <rect x="0.48" y="7.5" width="7" height="1" />
              <rect x="0.48" y="15.5" width="7" height="1" />
            </svg>
            <svg
              className="sub"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 17"
            >
              <rect x="1.56" y="0.5" width="16" height="1" />
              <rect x="1.56" y="7.5" width="16" height="1" />
              <rect x="1.56" y="15.5" width="16" height="1" />
            </svg>
          </NavLink>
          <Modal
            isOpen={this.state.modalOpen}
            toggle={this.toggleModal}
            wrapClassName="modal-right"
            backdrop="static"
          >
            <ModalHeader toggle={this.toggleModal}>
              <Row>{moment(new Date()).format("dddd")}</Row>
              <Row>{moment(new Date()).format("LL")}</Row>
            </ModalHeader>
            <ModalBody>
              {this.state.today &&
                this.state.today.map((item, index) => {
                  const name = item.course.name;
                  {
                    return item.assignment.map((mitem, k) => {
                      return (
                        <Card>
                          <CardBody className=" d-flex flex-md-row justify-content-between  ">
                            <Link
                              to="/app/myportal/assignment"
                              className="list-item-heading mb-0 truncate w-70 w-xs-100  mb-1 mt-1"
                            >
                              <span className="align-middle d-inline-block">
                                {mitem.title}
                              </span>
                            </Link>

                            <p className="mb-1 text-muted text-small w-16 w-xs-100">
                              {name}
                            </p>
                            <p className="mb-1 text-muted text-small w-16 w-xs-100">
                              {moment(mitem.duedate).format("LL")}
                            </p>
                            <a
                              href={`${URL}downloadfile/${mitem.file}`}
                              target="_blank"
                              download
                              className="mb-1 text-small w-17 w-xs-100"
                            >
                              Download
                            </a>
                          </CardBody>
                        </Card>
                      );
                    });
                  }
                })}
            </ModalBody>
            <ModalFooter></ModalFooter>
          </Modal>
        </nav>
      );
    } else {
      return <div className="loading"></div>;
    }
  }
}

const mapStateToProps = ({
  menu,
  settings,
  auth,
  subscribtion,
  course,
  notifications
}) => {
  const { containerClassnames, menuClickCount } = menu;
  const { locale, searchBy } = settings;
  const { notify, loading } = notifications;
  const { user } = auth;
  const { courses } = subscribtion.subscribed;
  const { myCourses } = course;
  return {
    loading,
    notify,
    containerClassnames,
    courses,
    myCourses,
    menuClickCount,
    locale,
    searchBy,
    user
  };
};
export default injectIntl(
  connect(mapStateToProps, {
    setContainerClassnames,
    clickOnMobileMenu,
    logout,
    changeLocale,
    searchSelection,
    searchKeyword,
    GetSubscription,
    getmyCourse,
    getNotifications
  })(TopNav)
);