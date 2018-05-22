import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { StitchClientFactory } from "mongodb-stitch";

// Set-up Stitch Connection
const stitchClientPromise = StitchClientFactory.create("sportsstore-skxjg");

// Authenticate
stitchClientPromise.then(stitchClient => {

  // Authenticate anonymously 
  stitchClient.login().then(() => console.log('logged into Stitch as: ' + stitchClient.authedId()))
    .catch(e => console.log('error: ', e));
});

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentTime: new Date().toLocaleTimeString(),
      indoorTemp: 72,
      outdoorTemp: 88
    };
    this.timer = this.timer.bind(this);
  }

  componentDidMount () {
    var internvalId = setInterval(this.timer, 1000);
  }

  timer () {
    this.setState( { currentTime: new Date().toLocaleTimeString()})
    this.getTemps().then(temps => this.setState({ indoorTemp: Math.round(temps.indoorTemp), outdoorTemp: Math.round(temps.outdoorTemp) }))
      .catch(e => {
        console.log('error', e)
      });
  }

  getTemps() {
    console.log("Entered getTemps()");
    return stitchClientPromise.then(stitchClient =>
      stitchClient.executeFunction("getTemperature")
    ).then(result => {
      console.log('success getting temperature data: ', result)
      return result;
    })
      .catch(e => {
        console.log('error', e)
        return []
      });
  }

  render() {
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Welcome to the MongoDB Sports Store</h1>
            <h3>Ponte Vedra Beach, FL</h3>
            <h4>It is {this.state.currentTime}.</h4>
            <h4>The current temperature is {this.state.outdoorTemp} °F outside and a comfortable {this.state.indoorTemp} °F inside our store.</h4>
          </header>
          <p></p>
        </div>
        <FilterableProductTable products={PRODUCTS} />
      </div>
    );
  }
}

class ProductCategoryRow extends React.Component {
  render() {
    const category = this.props.category;
    return (
      <tr>
        <th colSpan="2">
          {category}
        </th>
      </tr>
    );
  }
}

class ProductRow extends React.Component {
  render() {
    const product = this.props.product;
    const name = product.stocked ?
      product.name :
      <span style={{ color: 'red' }}>
        {product.name}
      </span>;

    return (
      <tr>
        <td>{name}</td>
        <td>{product.price}</td>
      </tr>
    );
  }
}

class ProductTable extends React.Component {
  render() {
    const filterText = this.props.filterText;
    const inStockOnly = this.props.inStockOnly;

    const rows = [];
    let lastCategory = null;

    this.props.products.forEach((product) => {
      if (product.name.indexOf(filterText) === -1) {
        return;
      }
      if (inStockOnly && !product.stocked) {
        return;
      }
      if (product.category !== lastCategory) {
        rows.push(
          <ProductCategoryRow
            category={product.category}
            key={product.category} />
        );
      }
      rows.push(
        <ProductRow
          product={product}
          key={product.name}
        />
      );
      lastCategory = product.category;
    });

    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    this.handleInStockChange = this.handleInStockChange.bind(this);
  }

  handleFilterTextChange(e) {
    this.props.onFilterTextChange(e.target.value);
  }

  handleInStockChange(e) {
    this.props.onInStockChange(e.target.checked);
  }

  render() {
    return (
      <form>
        <input
          type="text"
          placeholder="Search..."
          value={this.props.filterText}
          onChange={this.handleFilterTextChange}
        />
        <p>
          <input
            type="checkbox"
            checked={this.props.inStockOnly}
            onChange={this.handleInStockChange}
          />
          {' '}
          Only show products in stock
        </p>
      </form>
    );
  }
}

class FilterableProductTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
      inStockOnly: false,
      products: []
    };

    this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    this.handleInStockChange = this.handleInStockChange.bind(this);
  }

  getData(filterText) {
    console.log("Entered getData(" + filterText +")");
    return stitchClientPromise.then(stitchClient =>
      stitchClient.executeFunction("getProductsByName", filterText)
    ).then(result => {
      console.log('success getting products from Stitch: ', result)
      return result;
    })
      .catch(e => {
        console.log('error', e)
        return []
      });
  }

  handleFilterTextChange(filterText) {
    //this.setState({
    //  filterText: filterText
    //});
    this.getData(filterText).then(products => this.setState({ products: products, filterText: filterText }))
      .catch(e => {
        console.log('error', e)
      });
  }

  handleInStockChange(inStockOnly) {
    this.setState({
      inStockOnly: inStockOnly
    })
  }

  render() {
    return (
      <div>
        <SearchBar
          filterText={this.state.filterText}
          inStockOnly={this.state.inStockOnly}
          onFilterTextChange={this.handleFilterTextChange}
          onInStockChange={this.handleInStockChange}
        />
        <ProductTable
          products={this.state.products}
          filterText={this.state.filterText}
          inStockOnly={this.state.inStockOnly}
        />
      </div>
    );
  }
}

const PRODUCTS = [
  { category: 'Sporting Goods', price: '$49.99', stocked: true, name: 'Football' },
  { category: 'Sporting Goods', price: '$9.99', stocked: true, name: 'Baseball' },
  { category: 'Sporting Goods', price: '$29.99', stocked: false, name: 'Basketball' },
  { category: 'Electronics', price: '$99.99', stocked: true, name: 'iPod Touch' },
  { category: 'Electronics', price: '$399.99', stocked: false, name: 'iPhone 5' },
  { category: 'Electronics', price: '$199.99', stocked: true, name: 'Nexus 7' }
];


export default App;
