import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../../services/receipt.service';
import { NgxSpinnerService } from 'ngx-spinner';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions
} from "ng-apexcharts";

export type ChartOptionsPie = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
};

export type ChartOptionsBar = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  activeSection: string = 'menu';

  // Seccion Perfil
  currentUser: String = '';
  newUsername: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  selectedFile: File | null = null;
  profileImageUrl: SafeUrl | null = null;
  userProfileImage: string = 'https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg';

  // Seccion Menu
  selectedImage: File | null = null;
  extractedText: string | null = null;
  totalFromImage: number | null = null;
  total: number | null = null;
  category: string = '';
  date: string = '';

  // Seccion boletas
  boletas: any[] = [];
  showDeleteModal: boolean = false;
  showEditForm: boolean = false;
  deletingBoletaId: number = 0;
  editingBoletaId: number = 0;
  editingBoleta: any = {
    total: 0,
    categoria: '',
    fecha: ''
  };

  // Seccion de graficos
  @ViewChild("chartBar") chartBar: ChartComponent | undefined;
  public chartOptionsBar: Partial<ChartOptionsBar> | any;

  @ViewChild("chartPie") chartPie: ChartComponent | undefined;
  public chartOptionsPie: Partial<ChartOptionsPie> | any;

  // Seccion de estadisticas
  year: string = new Date().getFullYear().toString();
  kpi1: string= '';
  kpi2: string= '';
  kpi3: string= '';
  kpi4: number= 0;


  constructor(private spinner: NgxSpinnerService ,private teseServices: ReceiptService, private authService: AuthService, private router: Router, private sanitizer: DomSanitizer, private toastr: ToastrService) {
    this.chartOptionsPie = {
      series: [],
      chart: {
        width: 380,
        type: "pie",
        toolbar: {
          show: false
        }
      },
      labels: [],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 380
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
    this.chartOptionsBar = {
      series: [],
      chart: {
        type: "bar",
        height: 250,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: []
      }
    };
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      this.currentUser = this.authService.getUsername();
      this.getUserProfileImage();
      this.loadDatos();
    }
  }
  getUserProfileImage(): void {
    this.authService.getUserProfileImage().subscribe(
      (image: Blob) => {
        this.profileImageUrl = this.getImageUrl(image);
      },
      (error) => {
        console.error('Error fetching profile image:', error);
      }
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.selectedFile = file;
  }

  updateProfile() {
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.toastr.error('Las contraseñas no coinciden');
      return;
    }

    const formData = new FormData();

    if (this.newUsername) {
      formData.append('username', this.newUsername);
    }

    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    if (this.newPassword) {
      formData.append('password', this.newPassword);
    }

    if (formData.has('username') || formData.has('profileImage') || formData.has('password')) {
      this.authService.updateProfile(formData).subscribe(
        () => {
          this.getUserProfileImage();
          if (formData.has('username')) {
            this.currentUser = this.newUsername;
          }

          this.toastr.success('Perfil actualizado exitosamente');
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        err => this.toastr.error('A ocurrido un error')
      );
    } else {
      this.toastr.warning('No hay cambios para aplicar');
    }
  }

  getImageUrl(imageBlob: Blob | null): SafeUrl | null {
    if (imageBlob) {
      const imageUrl = URL.createObjectURL(imageBlob);
      return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
    } else {
      return null;
    }
  }

  onImageSelected(event: any): void {
    this.total = 0;
    this.totalFromImage = 0;
    this.category = "";
    this.date = "";
    this.selectedImage = event.target.files[0];
  }

  uploadImage(): void {
    if (!this.selectedImage) {
      this.toastr.error('Por favor ingrese una imagen');
      return;
    }

    this.spinner.show();

    this.teseServices.processReceipt(this.selectedImage)
      .then(text => {
        this.toastr.success('Exito al procesar la imagen');
        console.log('Texto extraído:', text);
        this.totalFromImage = text !== null ? +text : 0;
      })
      .catch(() => {
        this.toastr.error('Error al procesar la imagen');
      })
      .finally(() =>{
        this.spinner.hide();
      });
  }

  saveData() {
    if ((this.totalFromImage !== null || this.total !== null) && this.category && this.date) {
      const totalToSave = this.totalFromImage !== null ? this.totalFromImage : this.total || 0;

      const formattedDate = this.formatDate(this.date);

      this.teseServices.saveData(totalToSave, this.category, formattedDate)
        .subscribe(
          (response) => {
            this.loadDatos();
            console.log('Response from server:', response);
            this.toastr.success('Datos guardados correctamente');
          },
          (error) => {
            console.error('Error al guardar datos:', error);
            this.toastr.error('Error al guardar datos');
          }
        );
    } else {
      this.toastr.warning('Ingrese el total, la categoría y la fecha');
    }
  }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${year}-${month}-${day}`;
  }

  formatDateView(dateString: string): string {
    const date = new Date(dateString);
    const day = this.addLeadingZero(date.getDate());
    const month = this.addLeadingZero(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  addLeadingZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  loadDatos(): void {
    this.teseServices.getAllDatos().subscribe(
      (data: any[]) => {
        this.boletas = data.map(boletas => {
          boletas.fecha = this.formatDateView(boletas.fecha);
          return boletas;
        });
        this.funcionchistosaquelepasalosdatosalosgraficos(this.boletas);
        this.actualizarEstadisticas();
      },
      error => {
        this.toastr.error('Error al cargar las boletas');
      }
    );
  }

  funcionchistosaquelepasalosdatosalosgraficos(boletas: any[]): void {
    const monthYearMap: { [key: string]: number }= {};
    boletas.forEach(boleta => {
      const [day, month, year]= boleta.fecha.split('-');
      const fecha= new Date(parseInt(year), parseInt(month)-1, parseInt(day));

      const monthName= fecha.toLocaleString('default', { month: 'long' });
      const yearNumber= fecha.getFullYear();
      const monthYear= `${monthName}-${yearNumber}`;
      
      if (monthYearMap[monthYear]) {
        monthYearMap[monthYear]+= parseFloat(boleta.total);
      } else {
        monthYearMap[monthYear]= parseFloat(boleta.total);
      }
    });

    const monthYearArray= Object.keys(monthYearMap).map(monthYear => {
      const [monthName, year]= monthYear.split('-');
      const date= new Date(`${monthName} 1, ${year}`);
      return { monthYear, date };
    });
    monthYearArray.sort((a, b) => a.date.getTime()-b.date.getTime());

    const categories= monthYearArray.map(item=> item.monthYear);
    const seriesData= monthYearArray.map(item=> monthYearMap[item.monthYear]);

    this.chartOptionsBar.series= [
      {
        name: "Total acumulado",
        data: seriesData
      }
    ];
    this.chartOptionsBar.xaxis= {
      categories: categories
    };

    const heightcb= 200+(30 * categories.length);
    this.chartOptionsBar.chart.height=heightcb;

    if (this.chartBar) {
      this.chartBar.updateOptions(this.chartOptionsBar);
    }

    const categoryTotals: { [key: string]: number } = {};
    boletas.forEach(boleta => {
      const total= parseFloat(boleta.total);
      if (categoryTotals[boleta.categoria]) {
        categoryTotals[boleta.categoria] += total;
      } else {
        categoryTotals[boleta.categoria] = total;
      }
    });

    const pieCategories= Object.keys(categoryTotals);
    const pieSeriesData= Object.values(categoryTotals);

    this.chartOptionsPie.series= pieSeriesData;
    this.chartOptionsPie.labels= pieCategories;

    if (this.chartPie) {
      this.chartPie.updateOptions(this.chartOptionsPie);
    }
  }

  actualizarEstadisticas(): void {
    this.kpi1 = this.calcularMesMayorGasto();
    this.kpi2 = this.calcularCategoriaMayorGasto();
    this.kpi3 = this.calcularMesMayorCantidadCompras();
    this.kpi4 = this.calcularGastoTotal();
  }

  calcularMesMayorGasto(): string {
    const gastoPorMes: { [mes: string]: number }= {};
    this.boletas.forEach(boleta=> {
      const [day, month, year]= boleta.fecha.split('-');
      const fecha= new Date(parseInt(year), parseInt(month)-1, parseInt(day));
      const monthName= fecha.toLocaleString('default', { month: 'long' });
      const monthYear= `${monthName}-${year}`;
      if (gastoPorMes[monthYear]) {
        gastoPorMes[monthYear]+= parseFloat(boleta.total);
      } else {
        gastoPorMes[monthYear]= parseFloat(boleta.total);
      }
    });
  
    let mesMayorGasto: string= '';
    let mayorGasto: number= 0;
    for (const mes in gastoPorMes) {
      if (gastoPorMes.hasOwnProperty(mes)) {
        if (gastoPorMes[mes] > mayorGasto) {
          mayorGasto = gastoPorMes[mes];
          mesMayorGasto= mes;
        }
      }
    }
  
    return `${mesMayorGasto.split('-')[0]} $${mayorGasto}`;
  }
  
  calcularCategoriaMayorGasto(): string {
    const gastoPorCategoria: { [categoria: string]: number }= {};
  
    this.boletas.forEach(boleta => {
      if (gastoPorCategoria[boleta.categoria]) {
        gastoPorCategoria[boleta.categoria]+= parseFloat(boleta.total);
      } else {
        gastoPorCategoria[boleta.categoria]= parseFloat(boleta.total);
      }
    });
  
    let categoriaMayorGasto: string= '';
    let mayorGasto: number= 0;
    for (const categoria in gastoPorCategoria) {
      if (gastoPorCategoria.hasOwnProperty(categoria)) {
        if (gastoPorCategoria[categoria]>mayorGasto) {
          mayorGasto= gastoPorCategoria[categoria];
          categoriaMayorGasto= categoria;
        }
      }
    }
  
    return categoriaMayorGasto;
  }
  
  
  calcularMesMayorCantidadCompras(): string {
    const comprasPorMes: { [mes: string]: number }= {};
  
    this.boletas.forEach(boleta => {
      const [day, month, year]= boleta.fecha.split('-');
      const fecha= new Date(parseInt(year), parseInt(month)-1, parseInt(day));
      const monthName= fecha.toLocaleString('default', { month: 'long' });
      const monthYear= `${monthName}`;
  
      if (comprasPorMes[monthYear]) {
        comprasPorMes[monthYear]++;
      } else {
        comprasPorMes[monthYear]= 1;
      }
    });
  
    let mesMayorCompras: string= '';
    let mayorCantidad: number= 0;
    for (const mes in comprasPorMes) {
      if (comprasPorMes.hasOwnProperty(mes)) {
        if (comprasPorMes[mes] > mayorCantidad) {
          mayorCantidad= comprasPorMes[mes];
          mesMayorCompras= mes;
        }
      }
    }

    if(mayorCantidad === 1) {
      return `${mesMayorCompras} (${mayorCantidad} compra)`;
    } else {
      return `${mesMayorCompras} (${mayorCantidad} compras)`;
    }

  }
  
  calcularGastoTotal(): number {
    let gastoTotal: number= 0;
  
    this.boletas.forEach(boleta => {
      gastoTotal+= boleta.total;
    });
  
    return gastoTotal;
  }

  deleteBoleta(id: number): void {
    this.teseServices.deleteBoleta(id).subscribe(
      response => {
        this.toastr.success('Boleta eliminada correctamente');
        this.showDeleteModal = false;
        this.loadDatos();
      },
      error => {
        this.toastr.error('Error al eliminar la boleta');
      }
    );
  }

  openDeleteModal(id: number): void {
    this.deletingBoletaId = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  updateBoleta(): void {
    if (this.editingBoletaId !== null && this.editingBoleta.total !== null && this.editingBoleta.categoria && this.editingBoleta.fecha) {
      const updatedBoleta = {
        id: this.editingBoletaId,
        total: this.editingBoleta.total,
        categoria: this.editingBoleta.categoria,
        fecha: this.editingBoleta.fecha
      };

      this.teseServices.updateBoleta(updatedBoleta.id, updatedBoleta.total, updatedBoleta.categoria, updatedBoleta.fecha).subscribe(
        (response) => {
          this.toastr.success('Boleta actualizada correctamente');
          this.loadDatos();
          this.closeEditForm();
        },
        (error) => {
          this.toastr.error('Error al actualizar la boleta');
        }
      );
    } else {
      this.toastr.warning('Ingrese todos los campos');
    }
  }

  openEditForm(boleta: any): void {
    this.editingBoletaId = boleta.id;
    this.editingBoleta = {
      total: boleta.total,
      categoria: boleta.categoria,
      fecha: this.formatDateEdit(boleta.fecha)
    };

    this.showEditForm = true;
  }

  formatDateEdit(date: string): string {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  }

  closeEditForm(): void {
    this.showEditForm = false;
    this.editingBoletaId = 0;
    this.editingBoleta = {
      total: 0,
      categoria: '',
      fecha: ''
    };
  }
}
