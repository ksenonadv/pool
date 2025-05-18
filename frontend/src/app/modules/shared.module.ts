import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FaIconLibrary, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons'
import { RouterModule } from "@angular/router";
import { PrimeNgModule } from "./primeng.module";
import { FormatSecondsPipe } from "../pipes/format-seconds.pipe";

const modules = [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    FontAwesomeModule,
    PrimeNgModule,
];

@NgModule({
    imports: [...modules, FormatSecondsPipe],
    exports: [...modules, FormatSecondsPipe],
    providers: [FormatSecondsPipe]
})
export class SharedModule {

    constructor(library: FaIconLibrary) {
        library.addIconPacks(
            fas,
            fab,
            far
        );
    }
}