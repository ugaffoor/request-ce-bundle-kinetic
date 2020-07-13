import React, { Component } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import $ from 'jquery';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import ReactTable from 'react-table';

const chartLabels = {
  last_30_days: 'Last 30 Days',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_year: 'Last Year',
  custom: 'Custom Dates',
};
const RADIAN = Math.PI / 180;
const COLORS = [
  '#5a9ad5',
  '#70ad46',
  '#264478',
  '#8cc167',
  '#4472c4',
  '#ed7d32',
  '#a5a5a5',
  '#ffc001',
  '#FFB6C1',
  '#9932CC',
  '#8A2BE2',
  '#1E90FF',
  '#6495ED',
  '#ADD8E6',
  '#48D1CC',
  '#6B8E23',
  '#00FF00',
  '#F08080',
];

export class LeadsOriginChart extends Component {
  handleClose = () => {
    this.setState({
      isShowingModal: false,
      dateRange: this.state.lastDateRange,
    });
  };
  constructor(props) {
    super(props);
    let fromDate = this.props.fromDate;
    let toDate = this.props.toDate;
    let leads = this.props.leadsByDate;
    this.state = {
      fromDate: fromDate,
      toDate: toDate,
    };

    this.leadsOnClick = this.leadsOnClick.bind(this);
    this._getLeadColumns = this.getLeadColumns();

    let data = this.getData(leads);

    this.renderLeadsOriginCustomizedLabel = this.renderLeadsOriginCustomizedLabel.bind(
      this,
    );

    this.state = {
      data: data,
      fromDate: fromDate,
      toDate: toDate,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.leadsByDate) {
      this.setState({
        data: this.getData(nextProps.leadsByDate),
      });
    }
    if (
      nextProps.fromDate !== this.state.fromDate ||
      nextProps.toDate !== this.state.toDate
    ) {
      this.setState({
        fromDate: nextProps.fromDate,
        toDate: nextProps.toDate,
      });
      this.setState({
        data: this.getData(nextProps.leadsByDate),
      });
    }
  }
  componentWillMount() {
    this.setState({
      data: this.getData(this.state.leadsByDate),
    });
  }

  getData(leads, dateRange) {
    if (!leads || leads.length <= 0) {
      return [];
    }

    let leadsByType = new Map();

    let fromDate = moment(this.state.fromDate, 'YYYY-MM-DD');
    let toDate = moment(this.state.toDate, 'YYYY-MM-DD');

    leads.forEach(lead => {
      let createdDate = moment(lead.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate)
      ) {
        let objFound = leadsByType.get(lead.values['Source']);
        if (objFound) {
          objFound['value'] = objFound['value'] + 1;
          objFound['leads'][objFound['leads'].length] = {
            id: lead.id,
            name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
          };
        } else {
          leadsByType.set(lead.values['Source'], {
            name: lead.values['Source'],
            value: 1,
            key: lead.values['Source'],
            leads: [
              {
                id: lead.id,
                name:
                  lead.values['First Name'] + ' ' + lead.values['Last Name'],
              },
            ],
          });
        }
      }
    });

    let data = [];
    leadsByType.forEach(leadInfo => {
      data.push({
        name: leadInfo.name,
        value: leadInfo.value,
        key: leadInfo.key,
        leads: leadInfo.leads,
      });
    });

    return data;
  }
  renderLeadsOriginCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  leadsOnClick(e) {
    console.log(e.leads.length);
    this.setState({
      leads: e.leads,
      showLeads: true,
    });
  }
  getLeads(leads, col) {
    var leads_col = [];

    for (var i = col - 1; i < leads.length; i = i + 4) {
      //if (i % (col-1) === 0){
      leads_col[leads_col.length] = {
        leadId: leads[i].id,
        name: leads[i].name,
      };
      //}
    }

    return leads_col;
  }

  getLeadTableData(leads) {
    let leads_col1 = this.getLeads(leads, 1);
    let leads_col2 = this.getLeads(leads, 2);
    let leads_col3 = this.getLeads(leads, 3);
    let leads_col4 = this.getLeads(leads, 4);

    return [
      {
        leads: {
          leads_col1: leads_col1,
          leads_col2: leads_col2,
          leads_col3: leads_col3,
          leads_col4: leads_col4,
        },
      },
    ];
  }
  getLeadColumns = () => {
    return [
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col1['leadId']}`}
              className=""
            >
              {props.original.leads_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col2['leadId']}`}
              className=""
            >
              {props.original.leads_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col3['leadId']}`}
              className=""
            >
              {props.original.leads_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col4['leadId']}`}
              className=""
            >
              {props.original.leads_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getLeadTableColumns(row) {
    return [
      {
        accessor: 'leads',
        Header: 'Leads',
        headerClassName: 'leads_col',
        className: 'leads_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let leads_col1 = props.original.leads.leads_col1;
          let leads_col2 = props.original.leads.leads_col2;
          let leads_col3 = props.original.leads.leads_col3;
          let leads_col4 = props.original.leads.leads_col4;

          let leads = [];
          for (var i = 0; i < leads_col1.length; i++) {
            leads[leads.length] = {
              leads_col1: leads_col1[i],
              leads_col2: leads_col2.length > i ? leads_col2[i] : undefined,
              leads_col3: leads_col3.length > i ? leads_col3[i] : undefined,
              leads_col4: leads_col4.length > i ? leads_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getLeadColumns}
              pageSize={leads_col1.length > 20 ? 20 : leads_col1.length}
              showPagination={leads_col1.length > 20 ? true : false}
              data={leads}
            />
          );
        },
      },
    ];
  }
  render() {
    const { data } = this.state;
    return this.props.leadsByDateLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading Leads Origins ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
      <span>
        <div className="page-header leadsOrigin">
          <span className="header">
            <span className="label">Leads Conversion</span>
          </span>
        </div>
        {this.state.showLeads && (
          <div className="memberChartDetails">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showLeads: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getLeadTableColumns()}
              data={this.getLeadTableData(this.state.leads)}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {!this.state.showLeads && (
          <div className="leadsChart">
            <ResponsiveContainer minHeight={370}>
              <PieChart maxWidth={600} height={370}>
                <Pie
                  data={data}
                  nameKey="name"
                  dataKey="value"
                  cx={'50%'}
                  label={this.renderLeadsOriginCustomizedLabel}
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  isAnimationActive={false}
                  onClick={this.leadsOnClick}
                  style={{ cursor: 'pointer' }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      fill={COLORS[index % COLORS.length]}
                      key={entry.key}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </span>
    );
  }
}
