class LogCard extends React.Component {
  state = {
    autoScroll: this.props.autoScroll,
  }

  scrollToBottom = (force = false) => {
    if (!this.state.autoScroll && !force) return

    this.messagesEnd.scrollIntoView()
  }

  toggleAutoScroll = () => {
    !this.state.autoScroll && this.scrollToBottom()

    this.setState({
      autoScroll: !this.state.autoScroll
    })
  }

  convertTextURL = text => {
    const [ _, head, protocol, url, tail ] = text.match(/^(.*)(https:\/\/)(.*?)(\s.*)?$/)

    return (
      <span>
        {head}
        <a href={`https://${url}`} target="_blank">
          {`https://${url}`}
        </a>
        {tail}
      </span>
    )
  }

  convertRawURL = (text) => {
    const [ _, head, url, params, link_text, tail ] = text.match(/^(.*)<a href="(.*?)"(.*)>(.*)<\/a>(.*)$/)

    return (
      <span>
        {head}
        <a href={url} target="_blank">
          {link_text}
        </a>
        {tail}
      </span>
    )
  }

  componentDidMount() {
    this.scrollToBottom()
  }

  componentDidUpdate() {
    this.scrollToBottom()
  }

  render () {
    return (
      <div className="card shadow mb-4">
        {/* <!-- Card Header - Dropdown  --> */}
        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">
            <Link to="/logs">Logs</Link>
          </h6>

          {this.props.clearLog && !!this.props.log.length && (
          <InlineButton
            className="m-0 text-danger"
            onClick={() => confirm(`Clear log?`) && this.props.clearLog()}
          >
            Clear Log
          </InlineButton>
          )}

          <InlineButton
            className="m-0"
            onClick={() => this.scrollToBottom(true)}
          >
            Scroll to End
          </InlineButton>

          <InlineButton
            className="m-0 text-warning"
            onClick={() => this.toggleAutoScroll()}
          >
            {this.state.autoScroll
              ? (<i className="fas fa-toggle-on"></i>)
              : (<i className="fas fa-toggle-off"></i>)}
            &nbsp;
            {/*' '*/}
            Autoscroll
          </InlineButton>
        </div>
        {/* <!-- Card Body  --> */}
        <div className="card-body" style={{ height: "70vh", overflowY: "scroll" }}>
          {this.props.log.map((piece, index) => (
             piece == `<br>`
               ? <br key={index} />
               : (
                 <span key={index}>
                   {piece.includes('<a href')
                      ? this.convertRawURL(piece)
                      : (
                        piece.includes('https://')
                          ? this.convertTextURL(piece)
                          : piece
                      )}
                 </span>
               )
          ))}

          <div style={{ float: "left", clear: "both" }}
              ref={(el) => { this.messagesEnd = el; }}>
          </div>
        </div>
      </div>
    )
  }
}
