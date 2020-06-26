//************************************************* */
// Autor Alan Enrique Escudero Caporal
// Fecha 26/Junio/2020
// Version: 1.0.0
//************************************************* */

pragma solidity ^0.5.0;

contract Prueba {
    
    address public contractOwner;
    uint32 private numero;
    string private palabra;
    address private direccion;
    
    constructor() public {
        numero = 0;
        palabra = "";
        direccion = msg.sender;
        contractOwner = contractOwner = msg.sender;
    }
    
    function pushNumero(uint32 _numero) public {
        numero = _numero;
    }
    
    function pushPalabra(string memory _palabra) public {
        palabra = _palabra;
    }
    
    function pushDireccion(address _direccion) public {
        direccion = _direccion;
    }
    
    function pushDos(uint32 _numero, string memory _palabra) public {
        palabra = _palabra;
        numero = _numero;
    }
    
    function pushTres(uint32 _numero, string memory _palabra, address _direccion) public {
        palabra = _palabra;
        numero = _numero;
        direccion = _direccion;
    }
    
    function getOwner() public view returns (address){
        return contractOwner;
    }
    
    function getNumero() public view returns (uint32){
        return numero;
    }
    
    function getPalabra() public view returns (string memory){
        return palabra;
    }
    
    function getDireccion() public view returns (address){
        return direccion;
    }
}